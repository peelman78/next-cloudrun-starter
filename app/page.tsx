const PROTO_NAME = process.env.PROTO_NAME ?? 'protoname';

export default function HomePage() {
  return (
    <main>
      <section>
        <p className="kicker">Prototype shell</p>
        <h1>{PROTO_NAME}</h1>
        <p>
          Replace this page with your prototype. The shell is a Next.js 14 app
          deployed to Cloud Run as <code>{PROTO_NAME}</code>.
        </p>
      </section>
    </main>
  );
}
