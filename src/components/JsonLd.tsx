const serializeJsonLd = (data: Record<string, unknown> | Array<Record<string, unknown>>) =>
  JSON.stringify(data).replace(/</g, '\\u003c');

export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
