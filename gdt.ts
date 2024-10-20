#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as readline from 'readline';

class GitDiffTool {
    // Variaveis de estado
    private files: string[] = [];
    private focus: 'list' | 'diff' = 'list';
    private diffOffset: number = 0;

    private selectedFilePosition: [number, number] = [0, 0];

    // Tamanho da janela do terminal
    private windowSize: number = process.stdout.rows - 2;
    private listColumns: number = 0;

    private fileMatrix: string[][] = [];

    constructor() {
        this.init();
    }

    private init() {
        this.argsValidations();
        this.bootValidations();

        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);

        this.render();

        process.stdin.on('keypress', (str, key) => this.handleKeypress(str, key));
        process.on('SIGINT', () => this.exitProgram());
    }

    private argsValidations() {
        const args = process.argv.slice(2);
        if (args.includes('-h') || args.includes('--help')) {
            this.showHelp();
        }
    }

    private showHelp() {
        console.log("Ajuda - Visualizador de Modificações do Git");
        console.log("Comandos:");
        console.log("  ↑ / ↓ / ← / → : Navegar entre os arquivos modificados");
        console.log("  TAB || Enter  : Alternar entre a lista de arquivos e a visualização do diff");
        console.log("  Ctrl+C || Esc || q : Sair do programa");
        console.log("Exibe os arquivos modificados no repositório Git e suas diferenças.");
        process.exit(1);
    }


    private bootValidations() {
        if (!this.isGitRepository()) {
            console.error("Não é um repositório git.");
            process.exit(1);
        }

        this.files = this.getModifiedFiles();
        if (this.files.length === 0) {
            console.log("Nenhuma modificação encontrada.");
            process.exit(1);
        }

        this.hideCursor();
    }

    private isGitRepository(): boolean {
        try {
            execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
            return true;
        } catch (err) {
            return false;
        }
    }

    private getModifiedFiles(): string[] {
        try {
            const result = execSync('git diff --name-only').toString();
            return result.split('\n').filter(file => file !== '');
        } catch (err) {
            return [];
        }
    }

    private hideCursor() {
        process.stdout.write('\x1B[?25l');
    }

    private showCursor() {
        process.stdout.write('\x1B[?25h');
    }

    private clearScreen() {
        process.stdout.write('\x1B[2J\x1B[0;0H');
    }

    private colorText(color: 'red' | 'green' | 'blue' | 'reset', text: string): string {
        const colors = {
            red: '\x1B[31m',
            green: '\x1B[32m',
            blue: '\x1b[38;5;81m',
            reset: '\x1B[0m'
        };
        return `${colors[color] || colors.reset}${text}${colors.reset}`;
    }

    private render() {
        this.clearScreen();
        if (this.focus === 'list') {
            this.drawFileList();
        } else {
            this.drawDiff();
        }
    }

    private drawFileList() {
        if (this.files.length <= this.windowSize) {
            this.files.forEach((file, index) => {
                // this.selectedFilePosition[1] é usado aqui para pegar a posição do arquivo selecionado pois teoricamente só teremos uma coluna
                const isSelected = index === this.selectedFilePosition[1] ? '> ' : '';
                process.stdout.write(`${isSelected}${file}\n`);
            });
        } else {
            this.listColumns = Math.ceil(this.files.length / this.windowSize);
            const rows = Math.ceil(this.files.length / this.listColumns);

            for (let i = 0; i < rows; i++) {
                this.fileMatrix[i] = [];
                for (let j = 0; j < this.listColumns; j++) {
                    const fileIndex = i + j * rows;
                    if (fileIndex < this.files.length) {
                        this.fileMatrix[i].push(this.files[fileIndex]);
                    }
                }
            }

            const maxFileLength = Math.max(...this.files.map(file => file.length)) + 4;

            this.fileMatrix.forEach((row, rowIndex) => {
                const line = row.map((file, colIndex) => {
                    const isSelected = rowIndex === this.selectedFilePosition[1] && colIndex === this.selectedFilePosition[0] ? '> ' : '  ';
                    return isSelected + file.padEnd(maxFileLength, ' ');
                }).join('');
                process.stdout.write(`${line}\n`);
            });

        }
    }

    private drawDiff() {
        const diff = (this.fileMatrix.length === 0) ? this.getDiff(this.files[this.selectedFilePosition[1]]) : this.getDiff(this.fileMatrix[this.selectedFilePosition[1]][this.selectedFilePosition[0]]);
        const visibleDiff = diff.slice(this.diffOffset, this.diffOffset + this.windowSize);
        visibleDiff.forEach(line => {
            process.stdout.write(`${line}\n`);
        });
    }

    private getDiff(file: string): string[] {
        try {
            const diff = execSync(`git diff ${file}`).toString();
            const coloredDiff = diff.split('\n').map(line => {
                if (line.startsWith('-')) {
                    return this.colorText('red', line);
                } else if (line.startsWith('+')) {
                    return this.colorText('green', line);
                } else if (line.includes('@@')) {
                    return line.replace(/(@@.*?@@)/g, match => this.colorText('blue', match));
                }
                return line;
            });
            return coloredDiff;
        } catch (err) {
            return ['Erro ao obter o diff.'];
        }
    }

    // Controle de teclas (parte importante do loop)
    private handleKeypress(str: string, key: any) {
        if (key.ctrl && key.name === 'c' || key.name === 'q' || key.name === 'escape') {
            this.exitProgram();
        }

        if (key.name === 'up' && this.focus === 'list') {
            this.selectedFilePosition[1] = Math.max(this.selectedFilePosition[1] - 1, 0);
        }

        if (key.name === 'down' && this.focus === 'list') {
            if (this.fileMatrix.length > 0) {
                this.selectedFilePosition[1] = Math.min(this.selectedFilePosition[1] + 1, this.fileMatrix.length - 1);
            } else {
                this.selectedFilePosition[1] = Math.min(this.selectedFilePosition[1] + 1, this.files.length - 1);
            }
        }

        if (key.name === 'left' && this.focus === 'list' && this.fileMatrix.length > 0) {
            this.selectedFilePosition[0] = Math.max(this.selectedFilePosition[0] - 1, 0);
        }

        if (key.name === 'right' && this.focus === 'list' && this.fileMatrix.length > 0) {
            this.selectedFilePosition[0] = Math.min(this.selectedFilePosition[0] + 1, this.listColumns - 1);
        }

        if ((key.name === 'pageup' || key.name === 'up') && this.focus === 'diff') {
            this.diffOffset = Math.max(this.diffOffset - this.windowSize, 0);
        }

        if ((key.name === 'pagedown' || key.name === 'down') && this.focus === 'diff') {
            if (this.fileMatrix.length === 0) {
                this.diffOffset = Math.min(this.diffOffset + this.windowSize, this.getDiff(this.files[this.selectedFilePosition[1]]).length - this.windowSize);
            } else {
                this.diffOffset = Math.min(this.diffOffset + this.windowSize, this.getDiff(this.fileMatrix[this.selectedFilePosition[1]][this.selectedFilePosition[0]]).length - this.windowSize);
            }
        }

        if (key.name === 'tab' || key.name === 'return') {
            this.focus = (this.focus === 'list') ? 'diff' : 'list';
            this.diffOffset = 0;
        }

        this.render();
    }

    private exitProgram() {
        this.showCursor();
        this.clearScreen();
        process.exit();
    }

    // Para debugar
    private renderFooter() {
        const footerLine = `Posição do arquivo selecionado: Coluna ${this.selectedFilePosition[0]}, Linha ${this.selectedFilePosition[1]}`;
        process.stdout.write(`\x1B[${process.stdout.rows - 1};0H${footerLine.padEnd(process.stdout.columns, ' ')}`);
    }

    private renderFileMatrix() {
        console.log("\nMatriz de Arquivos:");
        this.fileMatrix.forEach((row, rowIndex) => {
            const line = row.map((file, colIndex) => {
                const isSelected = rowIndex === this.selectedFilePosition[1] && colIndex === this.selectedFilePosition[0] ? '> ' : '  ';
                return isSelected + file;
            }).join(' | ');
            console.log(line);
        });
    }
}

new GitDiffTool();