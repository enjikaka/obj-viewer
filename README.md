# `<obj-viewer>`

A Three.js based Web Component for displaying OBJ files along with MTL files on the modern web.

Note: Uses ResizeObserver. Polyfill it on your end.

## API

### Inputs

| Attribute | Description |
| --- | --- |
| `obj-source` | A path to your OBJ file. Local path or URL. |
| `mtl-source` | A path to your MTL file. Local path or URL. |
| `display-grid` | Wether or not to draw the grid. Boolean. |

## Usage

Install obj-viewer via npm or import it in your ES module supported browser with `import 'https://unpkg.com/obj-viewer?module';`

## Note

Because of a bug in the THREE.js's OrbitControls.js key down events on the embedded sites will not work.
