# Card Photos Folder

Drop your card photos here. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`

## How it works

Images placed in this folder are automatically displayed:
- As the **main product photo** on the product detail page (replacing the gradient card graphic)
- In the **product card** thumbnails on the browse/products page

## Naming convention

Name your images to match the product slug, or use any filename for the gallery slider.

### Examples
```
aurora-signature.jpg       ← shown for the "aurora-signature" product
ember-physical.png
my-custom-card.webp
```

If no matching photo is found for a product, the default gradient card is shown as a fallback.

## Multiple photos per product

Add multiple images with the same slug prefix to create a photo gallery:
```
aurora-signature-1.jpg
aurora-signature-2.jpg
aurora-signature-3.jpg
```

These will display as a swipeable gallery on the product detail page.
