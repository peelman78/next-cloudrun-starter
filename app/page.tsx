const PROTO_NAME = process.env.PROTO_NAME ?? 'protoname';

export default function HomePage() {
  return (
    <main>
      <section>
        <p className="kicker">MIRACL prototype shell</p>
        <h1>
          {PROTO_NAME}<span className="suffix">-miracl</span>
        </h1>
        <p>
          Replace this page with your prototype. The shell is a Next.js 14 app
          deployed to Cloud Run as <code>{PROTO_NAME}-miracl</code>.
        </p>
      </section>
    </main>
  );
}
