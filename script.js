let currentMode = 'javascript';
let pyodideInstance = null;
let rubyInstance = null;
let isLoading = false;

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
    html: '<h1>Hello, World!</h1>'
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
