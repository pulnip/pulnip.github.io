## mov to gif
```bash
# create palette
ffmpeg -i input.mov -vf "fps=15,scale=640:-1:flags=lanczos,palettegen" palette.png
```

```bash
# create gif using palette
ffmpeg -i input.mov -i palette.png -lavfi "fps=15,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" output.gif
```