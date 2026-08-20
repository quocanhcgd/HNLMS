export type ProductSpace = "public" | "platform" | "lms";

export function ProductBoundary({ space, children }: { space: ProductSpace; children: React.ReactNode }) {
  return (
    <div data-product-space={space} data-route-boundary={space} className={`productBoundary productBoundary--${space}`}>
      {children}
    </div>
  );
}
