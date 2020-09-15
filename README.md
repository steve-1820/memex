<img src="internals/img/memex-knowledge-map.png" width="100%" />

## Intro

This a POC on how a memex could potentially work.


## Demo

Streaming data from browser to Electron app: https://vimeo.com/456346417

Knowledge map for notes discovery: https://vimeo.com/455978016

Rich text editor to write notes: https://vimeo.com/456732222

## Motivation

Read the full blog article here: https://www.steveliu.co/memex


## Install


First, clone the repo via git and install dependencies:

```bash
git clone https://github.com/steve-1820/memex.git
cd memex
yarn
```

## Starting Development

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```bash
yarn dev
```

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```

## License

MIT Licence
