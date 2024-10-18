#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

// Configura o modo 'raw' do terminal para capturar teclas diretamente
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// Funções de controle de tela (ANSI)
function clearScreen() {
    process.stdout.write('\x1B[2J\x1B[0;0H'); // Limpa a tela e move o cursor para a posição 0,0
}

function showCursor() {
    process.stdout.write('\x1B[?25h');
}

function hideCursor() {
    process.stdout.write('\x1B[?25l');
}

function colorText(color, text) {
    const colors = {
        red: '\x1B[31m',
        green: '\x1B[32m',
        reset: '\x1B[0m'
    };
    return `${colors[color]}${text}${colors.reset}`;
}

// Verifica se o diretório atual é um repositório Git
function isGitRepository() {
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
        return true;
    } catch (err) {
        return false;
    }
}

// Exibe a mensagem de ajuda
function showHelp() {
    clearScreen();
    console.log("Ajuda - Visualizador de Modificações do Git");
    console.log("Comandos:");
    console.log("  ↑ / ↓ : Navegar entre os arquivos modificados");
    console.log("  TAB  : Alternar entre a lista de arquivos e a visualização do diff");
    console.log("  Ctrl+C || Esc || q : Sair do programa");
    console.log("Exibe os arquivos modificados no repositório Git e suas diferenças.");
    console.log("Pressione qualquer tecla para voltar ao programa...");

    // Espera pela entrada do usuário para voltar ao programa
    process.stdin.once('keypress', () => {
        clearScreen();
        hideCursor(); // Oculta o cursor antes de renderizar a interface
        checkModifiedFilesAndRender();
    });
}

// Pega os arquivos modificados
function getModifiedFiles() {
    try {
        const result = execSync('git diff --name-only').toString();
        return result.split('\n').filter(file => file !== '');
    } catch (err) {
        return [];
    }
}

// Buffer para armazenar os diffs já obtidos
const diffBuffer = {};

// Pega o diff de um arquivo (ou do buffer, se já disponível)
function getDiff(file) {
    if (diffBuffer[file]) {
        return diffBuffer[file]; // Retorna o diff do buffer se já estiver lá
    }

    try {
        const diff = execSync(`git diff ${file}`).toString();
        const coloredDiff = diff.split('\n').map(line => {
            if (line.startsWith('-')) {
                return colorText('red', line); // Linha removida/modificada em vermelho
            } else if (line.startsWith('+')) {
                return colorText('green', line); // Linha adicionada/modificada em verde
            }
            return line; // Outras linhas sem cor
        });
        diffBuffer[file] = coloredDiff; // Armazena no buffer
        return coloredDiff;
    } catch (err) {
        return ['Erro ao obter o diff.'];
    }
}

// Variáveis de estado
let files = [];
let selectedIndex = 0;
let focus = 'list'; // "list" ou "diff"
let diffOffset = 0; // Controla a rolagem do diff
let fileOffset = 0; // Controla a rolagem da lista de arquivos

// Tamanho da janela de visualização
const windowSize = process.stdout.rows - 2; // Deixa espaço para cabeçalhos ou rodapés

// Função para desenhar a lista de arquivos modificados
function drawFileList() {
    const visibleFiles = files.slice(fileOffset, fileOffset + windowSize);
    visibleFiles.forEach((file, index) => {
        const displayIndex = fileOffset + index;
        if (displayIndex === selectedIndex) {
            process.stdout.write(`> ${file}\n`); // Destaque o arquivo selecionado
        } else {
            process.stdout.write(`  ${file}\n`);
        }
    });
}

// Função para desenhar o diff do arquivo selecionado
function drawDiff() {
    const diff = getDiff(files[selectedIndex]);
    const visibleDiff = diff.slice(diffOffset, diffOffset + windowSize);
    visibleDiff.forEach(line => {
        process.stdout.write(`${line}\n`);
    });
}

// Função principal para atualizar a interface
function render() {
    clearScreen();
    if (focus === 'list') {
        drawFileList();
    } else {
        drawDiff();
    }
}

// Função de encerramento do programa
function exitProgram() {
    showCursor();  // Mostra o cursor antes de encerrar
    clearScreen(); // Limpa a tela ao encerrar
    process.exit();
}

// Função para verificar arquivos modificados e renderizar ou encerrar
function checkModifiedFilesAndRender() {
    if (!isGitRepository()) {
        console.log("Nenhuma modificação encontrada.");
        showCursor(); // Mostra o cursor antes de encerrar
        process.exit(); // Encerra o programa sem limpar a tela
    }

    files = getModifiedFiles();
    if (files.length === 0) {
        console.log("Nenhuma modificação encontrada.");
        showCursor(); // Mostra o cursor antes de encerrar
        process.exit(); // Encerra o programa sem limpar a tela
    } else {
        render();
    }
}

// Captura de teclas
process.stdin.on('keypress', (str, key) => {
    // Captura o Ctrl+C, 'q', ou 'esc' para encerrar o programa
    if (key.ctrl && key.name === 'c' || key.name === 'q' || key.name === 'escape') {
        exitProgram();
    }

    // Movimentação com as setas
    if (key.name === 'up' && focus === 'list') {
        selectedIndex = Math.max(selectedIndex - 1, 0);
        if (selectedIndex < fileOffset) {
            fileOffset = Math.max(fileOffset - 1, 0);
        }
    }

    if (key.name === 'down' && focus === 'list') {
        selectedIndex = Math.min(selectedIndex + 1, files.length - 1);
        if (selectedIndex >= fileOffset + windowSize) {
            fileOffset = Math.min(fileOffset + 1, files.length - windowSize);
        }
    }

    // Rolar o diff com setas quando o foco estiver no 'diff'
    if (key.name === 'up' && focus === 'diff') {
        diffOffset = Math.max(diffOffset - 1, 0);
    }

    if (key.name === 'down' && focus === 'diff') {
        diffOffset = Math.min(diffOffset + 1, getDiff(files[selectedIndex]).length - windowSize);
    }

    // Alternar entre a lista e o diff
    if (key.name === 'tab') {
        focus = (focus === 'list') ? 'diff' : 'list';
        diffOffset = 0; // Resetar rolagem do diff ao mudar para ele
    }

    render();
});

// Captura dos argumentos de linha de comando
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
    showHelp();
} else {
    hideCursor();
    checkModifiedFilesAndRender();
}

// Configuração para restaurar a posição do cursor em caso de erro
process.on('SIGINT', () => {
    exitProgram();
});