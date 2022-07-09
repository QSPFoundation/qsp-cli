# QSP cli

CLI tools QSP platform [https://qsp.org/](https://qsp.org/)


## Installation

```bash
npm install -g @qsp/cli
```

## Usage

For now CLI has only 1 commad avaliable for converting binary QSP files into text format and vice versa. It determines current format based on file extension. `.qsp` and `.gam` files are considered binary format, and `.qsps`, `.qsp-txt` and `.txt-qsp` as text format. For output `.qsp` is used for binary format and `.qsps` for text.

This will convert binary file and save it as `1.qsps` in same directory.
```sh
qsp-cli 1.qsp
```

This will convert text file and save it as `1.qsp` in same directory.
```sh
qsp-cli 1.qsps
```

You can pass several files in one call (even mixing binary and text).
```sh
qsp-cli 1.qsps 2.qsp
```

Globs are also supported
```sh
# converting all .qsp files in current directory
qsp-cli *.qsps 

# converting all .qsp files in current directory and all its nested directories
qsp-cli **/*.qsps 
```

Output directory can be changed with `--directory` argument. Directory structure is preserved in this case.
```sh
# saves output into dist/src/1.qsp
qsp-cli --directory=dist src/1.qsps 
```

Text format is save using utf-8 encoding by default. This is not compatible with older tool `txt2gam` that works with utf16le encoding. To change output encoding use `--unicode` argument.
```sh
qsp-cli --unicode 1.qsp 
```


## Licensing

The code in this project is licensed under MIT license.
