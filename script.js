let currentMode = 'javascript';
let pyodideInstance = null;
let rubyInstance = null;
let luaInstance = null;
let phpInstance = null;
let tccInstance = null;
let dotnetInstance = null;
let isLoading = false;

// テーマ切り替え機能
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const icon = themeToggle.querySelector('i');

    // ローカルストレージからテーマを読み込む
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(icon, savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(icon, newTheme);
    });
}

function updateThemeIcon(icon, theme) {
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});

// Pyodideの初期化
async function initPyodide() {
    if (!pyodideInstance) {
        try {
            showLoading('Python環境を準備中...');
            pyodideInstance = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
            });
            hideLoading();
        } catch (error) {
            hideLoading();
            throw new Error('Python環境の準備に失敗しました: ' + error.message);
        }
    }
    return pyodideInstance;
}

// Rubyの初期化
async function initRuby() {
    if (!rubyInstance) {
        rubyInstance = await RubyWasm.init();
    }
    return rubyInstance;
}

// Luaの初期化
async function initLua() {
    if (!luaInstance) {
        const wasmoon = new Wasmoon();
        luaInstance = await wasmoon.initialize();
    }
    return luaInstance;
}

// PHPの初期化
async function initPHP() {
    if (!phpInstance) {
        phpInstance = await PHP.init();
    }
    return phpInstance;
}

// C言語の初期化
async function initC() {
    if (!tccInstance) {
        try {
            showLoading('C言語実行環境を準備中...');
            tccInstance = await TCC.init();
            hideLoading();
        } catch (error) {
            hideLoading();
            throw new Error('C言語環境の準備に失敗しました: ' + error.message);
        }
    }
    return tccInstance;
}

// C#の初期化
async function initCSharp() {
    if (!dotnetInstance) {
        try {
            showLoading('C#実行環境を準備中...');
            dotnetInstance = await Blazor.start();
            hideLoading();
        } catch (error) {
            hideLoading();
            throw new Error('C#環境の準備に失敗しました: ' + error.message);
        }
    }
    return dotnetInstance;
}

// ローディング表示
function showLoading(message) {
    isLoading = true;
    const output = document.getElementById('output');
    output.innerHTML = `<div class="loading">${message}</div>`;
}

function hideLoading() {
    isLoading = false;
}

// 言語ごとのサンプルコード
const samples = {
    javascript: 'console.log("Hello, World!");',
    python: 'print("Hello, World!")',
    ruby: 'puts "Hello, World!"',
    cpp: '#include <iostream>\nint main() {\n    std::cout << "Hello, World!";\n    return 0;\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    php: '<?php\necho "Hello, World!";\n?>',
    lua: 'print("Hello, World!")',
    html: '<h1>Hello, World!</h1>',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
};

// タブ切り替えの処理
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', async function() {
        currentMode = this.dataset.mode;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        const output = document.getElementById('output');
        const preview = document.getElementById('preview');
        const editor = document.getElementById('code-editor');
        
        // プレースホルダーの更新
        editor.placeholder = samples[currentMode];
        
        if (currentMode === 'html') {
            output.style.display = 'none';
            preview.style.display = 'block';
            updatePreview();
        } else {
            output.style.display = 'block';
            preview.style.display = 'none';
        }
    });
});

// プレビューの更新
function updatePreview() {
    const code = document.getElementById('code-editor').value;
    document.getElementById('preview').innerHTML = code;
}

// コードエディタの入力監視
document.getElementById('code-editor').addEventListener('input', function() {
    if (currentMode === 'html') {
        updatePreview();
    }
});

// コード実行処理
async function executeCode(code, mode) {
    try {
        let result = '';
        switch (mode) {
            case 'javascript':
                const oldLog = console.log;
                let logs = [];
                console.log = function(...args) {
                    logs.push(args.join(' '));
                };
                eval(code);
                result = logs.join('<br>');
                console.log = oldLog;
                break;

            case 'python':
                const pyodide = await initPyodide();
                result = await pyodide.runPythonAsync(code);
                break;

            case 'ruby':
                const ruby = await initRuby();
                result = await ruby.eval(code);
                break;

            case 'lua':
                const lua = await initLua();
                result = await lua.doString(code);
                break;

            case 'php':
                const php = await initPHP();
                result = await php.run(code);
                break;

            case 'cpp':
                showLoading('C++のWebAssembly実行環境を準備中...');
                // Web Assembly経由でのC++実行は複雑なため、現在は未実装のメッセージを表示
                result = "C++の実行環境は現在準備中です。";
                break;

            case 'java':
                showLoading('Javaの実行環境を準備中...');
                // Java実行環境は複雑なため、現在は未実装のメッセージを表示
                result = "Java実行環境は現在準備中です。";
                break;

            case 'c':
                const tcc = await initC();
                result = await tcc.run(code);
                break;

            case 'csharp':
                const dotnet = await initCSharp();
                result = await dotnet.invokeMethod('CodeRunner', 'RunCode', code);
                break;
        }
        return result;
    } catch (error) {
        throw new Error(`実行エラー: ${error.message}`);
    }
}

// 実行ボタンの処理
document.getElementById('run-button').addEventListener('click', async function() {
    if (isLoading) return;
    
    const code = document.getElementById('code-editor').value;
    const output = document.getElementById('output');

    if (currentMode === 'html') {
        updatePreview();
        return;
    }

    try {
        showLoading('実行中...');
        const result = await executeCode(code, currentMode);
        output.innerHTML = result || '実行完了';
    } catch (error) {
        output.innerHTML = `<div class="error">${error.message}</div>`;
    } finally {
        hideLoading();
    }
});
