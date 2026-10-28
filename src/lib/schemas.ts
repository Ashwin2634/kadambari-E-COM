import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  category: z.string().min(2),
  fitType: z.string().optional(),
  fabric: z.object({ material: z.string().optional(), care: z.array(z.string()).optional() }).optional(),
  pricing: z.object({ basePrice: z.number().min(0), salePrice: z.number().min(0).optional(), isOnSale: z.boolean().optional() }),
  variants: z.array(z.object({ color: z.string(), colorCodeHex: z.string().optional(), size: z.string(), stockQuantity: z.number().int().min(0), isAvailable: z.boolean().optional() })),
  images: z.array(z.object({ publicId: z.string().optional(), url: z.string().url(), altText: z.string().optional(), isCover: z.boolean().optional() })),
  seo: z.object({ metaTitle: z.string().optional(), metaDescription: z.string().optional(), keywords: z.array(z.string()).optional() }).optional(),
  tags: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});

