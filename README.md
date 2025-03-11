<h1>
  <p align="center">
    <img src="static/logo.svg" alt="Logo" width="256">
    <br>open-tui
  </p>
</h1>

<img src="static/open-tui-demo.gif" alt="demo">

## About

**open-tui** is a terminal application aiming to provide a similar user experience to [Open WebUI](https://github.com/open-webui/open-webui)... but in the terminal. Tired of context switching back and forth between your browser? Then this is the TUI for you! **open-tui** currently supports:

- Model selection: Change which LLM you are using on the fly
- Chat selection: Switch back and forth between different chats to preserve context. Create new chats.
- Sync Chats: By piggybacking off of Open WebUI, all of your chats made inside **open-tui** are shared with your Open WebUI session.

> [!NOTE]
> Requires a running instance of Open WebUI. To get started with Open WebUI, visit their [docs](https://docs.openwebui.com/).

## Download/Usage

To install globally:

```sh
npm i -g open-tui
```

then run

```sh
open-tui
```

**open-tui** requires two environment variables to function:

- `OPENTUI_WEBUI_HOST`: IP/Domain name of your Open WebUI instance (Example http://192.168.68.50:4000)
- `OPENTUI_WEBUI_TOKEN`: Can be found under Account -> API Keys

export them via `export VARIABLE_NAME=value` (preferably in your `.zshrc` to persist across your terminal sessions). For a list of all environment variables see below.

| Environment Variable            | Type   | Description                                     |
| ------------------------------- | ------ | ----------------------------------------------- |
| `OPENTUI_WEBUI_TOKEN`           | string | Authentication token for OpenTUI WebUI.         |
| `OPENTUI_WEBUI_HOST`            | string | The WebUI server host URL.                      |
| `OPENTUI_LOG` (optional)        | string | Path to the log file.                           |
| `OPENTUI_APPEND_LOG` (optional) | string | Whether to append to the log file (true/false). |

> [!NOTE]
> Using a program like [Tailscale](https://tailscale.com/) can allow secure access to your locally running services and it's pretty easy to setup!

## Install locally

**Requirements**

- [Bun](https://bun.sh/)

```sh
git clone https://github.com/ZachJW34/open-tui.git && \
cd open-tui && \
bun i && \
bun run dev
```

## Further improvements

Open WebUI is a feature packed application so I don't expect this TUI to ever have featuer parity with it. Nonetheless, I'd like to expand upon it so as to limit the amount of times I have to switch to the web version. This could be:

- Multiline prompt support: Currently annoying to only be able to input on one continuous line without line breaks
- Respect Open WebUI user settings: Templates, variables etc..
- Delete chats
- Regenerate/modify responses
- File upload support
- Multi-model response
- Theming
- a whole lot more...
- Add tests

Currently, it scratches the itch of being able to quickly pull up an LLM while developing. Plus, TUIs just feel and look cool.

## Contributing

Contributors welcome! Feel free to fork and create a PR.
