# Convert MJML templates to HTML templates

This action will take an `input` (root of your MJML templates) and `output` (root of your HTML templates)

## How does it work?

You simply provide the root source of your MJML templates to `input` and the output for your HTML templates, and it will go through your directories and subdirectories, grab all the `.mjml` files and convert them into `.html` files following the same directory structure

### Inputs

| input    | required | description                                    |
|----------|----------|------------------------------------------------|
| `input`  | yes      | The directory of your MJML templates           |
| `output` | yes      | Where your HTML templates will be converted to |


### Full example

Create a file `mjml-to-html.yml` in `.github/workflows`

```yaml
name: Convert MLML templates to HTML templates

on: [push]

jobs:
  run:
    runs-on: ubuntu-18.04
    strategy:
      matrix:
        input: [templates]
        output: [dist]

    steps:
      - uses: alveshelio/mjml-to-html-github-action@v1.0.0
        with:
          input: ${{matrix.input}}
          output: ${{matrix.output}}
```
