# Git Diff Tool (gdt)

Git Diff Tool (gdt) é uma ferramenta de linha de comando (CLI) para visualizar modificações em um repositório Git. Ela permite navegar entre os arquivos modificados e visualizar as diferenças (diffs) de forma interativa.

## Funcionalidades

- Exibe a lista de arquivos modificados no repositório Git.
- Permite navegar entre os arquivos modificados usando as setas do teclado.
- Exibe o diff dos arquivos selecionados com destaque para linhas adicionadas e removidas.
- Alterna entre a lista de arquivos e a visualização do diff.
- Exibe uma mensagem de ajuda com os comandos disponíveis.
- Detecta se o diretório atual não é um repositório Git e exibe uma mensagem apropriada.

## Comandos

- `↑ / ↓` : Navegar entre os arquivos modificados.
- `TAB` : Alternar entre a lista de arquivos e a visualização do diff.
- `q` : Sair do programa.
- `Esc` : Sair do programa.
- `Ctrl+C` : Sair do programa.

## Uso

### Executar a ferramenta

Para executar a ferramenta, navegue até o diretório onde o script `gdt` está localizado e execute:

```sh
./gdt
```

Exibir a ajuda
Para exibir a mensagem de ajuda, execute o script com o argumento -h ou --help:

```sh
./gdt -h
```

ou

```sh
./gdt --help
```

Instalação
Para tornar o script executável e movê-lo para um diretório no PATH, siga os passos abaixo:

- Torne o arquivo executável:

```sh
chmod +x gdt
```

- (Opcional) Mova o arquivo para um diretório no PATH, como /usr/local/bin:

```sh
sudo mv gdt /usr/local/bin/gdt
```

Agora você pode executar o script de qualquer lugar no terminal:

```sh
gdt
```

Exemplo de Uso

Sem arquivos modificados

```sh
$ gdt
Nenhuma modificação encontrada.
```

Com arquivos modificados

```sh
$ gdt
> arquivo1.txt
  arquivo2.js
  arquivo3.css

# Exibe o diff do arquivo selecionado
```

Exibir a ajuda

```sh
$ gdt -h
Ajuda - Visualizador de Modificações do Git
Comandos:
  ↑ / ↓ : Navegar entre os arquivos modificados
  TAB  : Alternar entre a lista de arquivos e a visualização do diff
  Ctrl+C || Esc || q : Sair do programa
Exibe os arquivos modificados no repositório Git e suas diferenças.
Pressione qualquer tecla para voltar ao programa...
```

Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests para melhorias e correções.

Licença
Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](https://github.com/Keimich/gdt/blob/main/LICENSE) para mais detalhes.

Este [README.md](https://github.com/Keimich/gdt/blob/main/README.md) fornece uma visão geral completa do projeto, incluindo suas funcionalidades, comandos, uso e instruções de instalação.
