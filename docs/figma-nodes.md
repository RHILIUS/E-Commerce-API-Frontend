# Figma Node Registry

This registry maps stable frontend screens and reusable components to their Figma nodes. Check it before searching the Figma file, and update it when a listed node is replaced or removed.

Read the [Figma agent workflow and design architecture](figma-agent-guide.md) before generating or modifying UI. The [Product Page brief](ecommerce/product-page-design-brief.md) records the accepted design and open implementation decisions separately.

## E-Commerce Wireframe

- **File:** [E-Commerce Wireframe](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe)
- **File key:** `8F5dYlZFxUEN6HKHWMOAwe`

| Frontend feature                     | Figma node                                                                                                                    | Node ID     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Web page (current destination)       | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5002-2706&m=dev) | `5002:2706` |
| Ecommerce / Components container     | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-959&m=dev)  | `5569:959`  |
| Product Card / Refined component set | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5550-5650&m=dev) | `5550:5650` |
| Landing page                         | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-353&m=dev)  | `5569:353`  |
| Header component                     | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-950&m=dev)  | `5569:950`  |
| Landing page header instance         | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-354&m=dev)  | `5569:354`  |
| Account overlay                      | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5587-148&m=dev)  | `5587:148`  |
| Login page                           | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5100-181&m=dev)  | `5100:181`  |

Figma URLs use hyphenated node IDs in query parameters, while Figma APIs use colon-separated IDs. For example, `node-id=5569-353` corresponds to `5569:353`.

## Product Page designs

The [accepted brief and design handoff](ecommerce/product-page-design-brief.md) describe scope, sample content, validation, and prototype limitations. Desktop references are 1440px wide; mobile references are 375px wide.

Use one screen per layout and product state with theme mode set to Auto/inherit from its parent. Theme-specific duplicate screens are not part of the registry.

| State                 | Desktop                                                                                                                 | Mobile                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Active                | [5652:149](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5652-149&m=dev) | [5666:511](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5666-511&m=dev) |
| Archived              | [5663:402](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5663-402&m=dev) | [5671:581](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5671-581&m=dev) |
| Draft                 | [5663:484](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5663-484&m=dev) | [5671:663](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5671-663&m=dev) |
| Active / Out of stock | [5663:564](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5663-564&m=dev) | [5671:743](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5671-743&m=dev) |

The [Active mobile scrolling viewport](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5677-7524&m=dev) demonstrates vertical scrolling at 375 × 568. The other screen frames show the complete page content.

### Reusable Product Page components

| Component                     | Node                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Components container          | [5652:148](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5652-148&m=dev)   |
| Gallery image variants        | [5661:327](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5661-327&m=dev)   |
| Gallery thumbnail             | [5653:170](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5653-170&m=dev)   |
| Purchase panel state variants | [5660:326](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5660-326&m=dev)   |
| Quantity state variants       | [5661:5946](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5661-5946&m=dev) |
| Product description           | [5657:219](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5657-219&m=dev)   |
| Store card                    | [5657:222](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5657-222&m=dev)   |
| Compact header                | [5662:287](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5662-287&m=dev)   |
