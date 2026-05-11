import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Item = { designacao: string; preco: number; qtd: number };
type Fatura = {
  codigo: string;
  data: string;
  pagamento: string;
  items: Item[];
  maoObra: number;
  transporte: number;
  total: number;
};

const ACCESS_USER = "admin";
const ACCESS_PASS = "ikasu";

function Login({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (user === ACCESS_USER && pass === ACCESS_PASS) onLogin();
          else setErr("Credenciais inválidas (admin / ikasu)");
        }}
        className="w-[350px] bg-blue-800 p-10 rounded-3xl text-center shadow-2xl"
      >
        <div className="w-28 h-28 mx-auto mb-5 rounded-full bg-white flex items-center justify-center text-blue-800 font-extrabold text-2xl">
          IKA SU
        </div>
        <h2 className="text-white text-xl font-bold mb-6">MEMBER LOGIN</h2>
        <input
          className="w-full p-3 my-2 rounded-lg text-black"
          placeholder="Utilizador"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          className="w-full p-3 my-2 rounded-lg text-black"
          type="password"
          placeholder="Senha"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        {err && <p className="text-yellow-300 text-sm mt-2">{err}</p>}
        <button className="w-full p-3 mt-4 bg-yellow-400 text-black rounded-lg font-bold text-lg">
          LOGIN
        </button>
      </form>
    </div>
  );
}

function Sistema() {
  const [view, setView] = useState<"fatura" | "lista">("fatura");
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [selecionada, setSelecionada] = useState<Fatura | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [designacao, setDesignacao] = useState("");
  const [preco, setPreco] = useState<number | "">("");
  const [qtd, setQtd] = useState<number | "">(1);
  const [pagamento, setPagamento] = useState("Dinheiro");
  const [maoObra, setMaoObra] = useState<number | "">(0);
  const [transporte, setTransporte] = useState<number | "">(0);
  const [codigo, setCodigo] = useState("FAT-001");
  const invoiceRef = useRef<HTMLDivElement>(null);

  const hoje = new Date().toLocaleDateString("pt-PT");

  const totalBruto = useMemo(
    () => items.reduce((s, i) => s + i.preco * i.qtd, 0),
    [items],
  );
  const total = totalBruto + Number(maoObra || 0) + Number(transporte || 0);

  const addItem = () => {
    if (!designacao || !preco || !qtd) return;
    setItems([...items, { designacao, preco: Number(preco), qtd: Number(qtd) }]);
    setDesignacao("");
    setPreco("");
    setQtd(1);
  };

  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const fmt = (n: number) => `${n.toLocaleString("pt-PT")} Kz`;

  const imprimir = () => {
    const w = window.open("", "", "width=800,height=900");
    if (!w || !invoiceRef.current) return;
    w.document.write(
      `<html><head><title>Fatura ${codigo}</title><style>
      body{font-family:Arial;padding:20px;color:#000}
      table{width:100%;border-collapse:collapse;margin-top:15px}
      th,td{border:1px solid #333;padding:8px;text-align:center}
      h1{color:#2563eb}.right{text-align:right}
      </style></head><body>${invoiceRef.current.innerHTML}</body></html>`,
    );
    w.document.close();
    w.print();
  };

  const guardarPDF = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const jsPDF = w.jspdf?.jsPDF;
    if (!jsPDF) {
      // load on demand
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = () => res();
        s.onerror = () => rej();
        document.body.appendChild(s);
      });
    }
    const JSPDF = w.jspdf.jsPDF;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = new JSPDF();
    let y = 15;
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text("FATURA - IKA SU", 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Código: ${codigo}`, 14, y);
    doc.text(`Data: ${hoje}`, 140, y);
    y += 6;
    doc.text(`Pagamento: ${pagamento}`, 14, y);
    y += 10;
    doc.text("Designação", 14, y);
    doc.text("Qtd", 100, y);
    doc.text("Preço", 120, y);
    doc.text("Total", 160, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;
    items.forEach((it) => {
      doc.text(it.designacao.slice(0, 40), 14, y);
      doc.text(String(it.qtd), 100, y);
      doc.text(fmt(it.preco), 120, y);
      doc.text(fmt(it.preco * it.qtd), 160, y);
      y += 6;
    });
    y += 8;
    doc.text(`Total Bruto: ${fmt(totalBruto)}`, 130, y);
    y += 6;
    doc.text(`Mão de Obra: ${fmt(Number(maoObra || 0))}`, 130, y);
    y += 6;
    doc.text(`Transporte: ${fmt(Number(transporte || 0))}`, 130, y);
    y += 6;
    doc.setFontSize(13);
    doc.text(`TOTAL: ${fmt(total)}`, 130, y);
    doc.save(`${codigo}.pdf`);
  };

  const guardar = () => {
    const dados = {
      codigo,
      data: hoje,
      pagamento,
      items,
      maoObra: Number(maoObra || 0),
      transporte: Number(transporte || 0),
      total,
    };
    const prev = JSON.parse(localStorage.getItem("ikasu_faturas") || "[]");
    prev.push(dados);
    localStorage.setItem("ikasu_faturas", JSON.stringify(prev));
    const next =
      "FAT-" +
      String(prev.length + 1).padStart(3, "0");
    setCodigo(next);
    alert("Fatura guardada com sucesso!");
  };

  const abrirLista = () => {
    const prev: Fatura[] = JSON.parse(
      localStorage.getItem("ikasu_faturas") || "[]",
    );
    setFaturas(prev);
    setSelecionada(null);
    setView("lista");
  };

  return (
    <div className="min-h-screen p-5 bg-slate-900 text-white">
      <header className="flex items-center justify-between bg-slate-950 p-5 rounded-2xl mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-blue-700 font-extrabold">
            IKA SU
          </div>
          <div>
            <h1 className="text-2xl font-bold">IKA SU</h1>
            <p className="text-slate-300 text-sm">
              Sistema de Venda &amp; Faturação
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => (view === "fatura" ? abrirLista() : setView("fatura"))}
            className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-bold"
          >
            {view === "fatura" ? "Ver Faturas" : "Nova Fatura"}
          </button>
          <p className="text-slate-300">Data: {hoje}</p>
        </div>
      </header>

      {view === "lista" ? (
        <section className="bg-slate-800 p-5 rounded-2xl">
          <h3 className="text-yellow-400 font-bold mb-3">Faturas Guardadas</h3>
          {faturas.length === 0 ? (
            <p className="text-slate-400">Nenhuma fatura guardada.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-700 p-2 text-left">Código</th>
                  <th className="bg-slate-700 p-2 text-left">Data</th>
                  <th className="bg-slate-700 p-2 text-right">Total</th>
                  <th className="bg-slate-700 p-2">—</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map((f, i) => (
                  <tr key={i} className="border-b border-slate-700">
                    <td className="p-2">{f.codigo}</td>
                    <td className="p-2">{f.data}</td>
                    <td className="p-2 text-right">{fmt(f.total)}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => setSelecionada(f)}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 font-bold"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selecionada && (
            <div className="bg-white text-black p-6 rounded-xl mt-5">
              <div className="flex justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h1 className="text-blue-600 text-2xl font-extrabold">FATURA</h1>
                  <p><b>Empresa:</b> IKA SU</p>
                </div>
                <div className="text-right">
                  <p><b>Código:</b> {selecionada.codigo}</p>
                  <p><b>Data:</b> {selecionada.data}</p>
                  <p><b>Pagamento:</b> {selecionada.pagamento}</p>
                </div>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-slate-100">Designação</th>
                    <th className="border p-2 bg-slate-100">Qtd</th>
                    <th className="border p-2 bg-slate-100">Preço</th>
                    <th className="border p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selecionada.items.map((it, i) => (
                    <tr key={i}>
                      <td className="border p-2">{it.designacao}</td>
                      <td className="border p-2 text-center">{it.qtd}</td>
                      <td className="border p-2 text-right">{fmt(it.preco)}</td>
                      <td className="border p-2 text-right">{fmt(it.preco * it.qtd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-4 space-y-1">
                <p><b>Mão de Obra:</b> {fmt(selecionada.maoObra)}</p>
                <p><b>Transporte:</b> {fmt(selecionada.transporte)}</p>
                <p className="text-lg font-bold text-blue-700">Total: {fmt(selecionada.total)}</p>
              </div>
            </div>
          )}
        </section>
      ) : (
      <div className="grid md:grid-cols-2 gap-5">
        <section className="bg-slate-800 p-5 rounded-2xl">
          <h3 className="text-yellow-400 font-bold mb-3">
            Cadastro de Produtos e Serviços
          </h3>
          <input
            className="w-full p-3 mt-2 rounded-lg text-black"
            placeholder="Designação"
            value={designacao}
            onChange={(e) => setDesignacao(e.target.value)}
          />
          <input
            className="w-full p-3 mt-2 rounded-lg text-black"
            type="number"
            placeholder="Preço unitário (Kz)"
            value={preco}
            onChange={(e) =>
              setPreco(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <input
            className="w-full p-3 mt-2 rounded-lg text-black"
            type="number"
            placeholder="Quantidade"
            value={qtd}
            onChange={(e) =>
              setQtd(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <input
            className="w-full p-3 mt-2 rounded-lg text-black"
            type="number"
            placeholder="Mão de obra (Kz)"
            value={maoObra}
            onChange={(e) =>
              setMaoObra(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <input
            className="w-full p-3 mt-2 rounded-lg text-black"
            type="number"
            placeholder="Transporte (Kz)"
            value={transporte}
            onChange={(e) =>
              setTransporte(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <select
            className="w-full p-3 mt-2 rounded-lg text-black"
            value={pagamento}
            onChange={(e) => setPagamento(e.target.value)}
          >
            <option>Dinheiro</option>
            <option>TPA</option>
            <option>Transferência Bancária</option>
          </select>

          <button
            onClick={addItem}
            className="mt-4 px-5 py-3 rounded-lg bg-green-500 hover:bg-green-600 font-bold"
          >
            Adicionar Produto
          </button>

          <table className="w-full mt-4 border-collapse">
            <thead>
              <tr>
                <th className="bg-slate-700 p-2">Designação</th>
                <th className="bg-slate-700 p-2">Preço</th>
                <th className="bg-slate-700 p-2">Qtd</th>
                <th className="bg-slate-700 p-2">Total</th>
                <th className="bg-slate-700 p-2">—</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-slate-400">
                    Nenhum item adicionado
                  </td>
                </tr>
              )}
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2">{it.designacao}</td>
                  <td className="p-2">{fmt(it.preco)}</td>
                  <td className="p-2">{it.qtd}</td>
                  <td className="p-2">{fmt(it.preco * it.qtd)}</td>
                  <td className="p-2">
                    <button
                      onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-slate-800 p-5 rounded-2xl">
          <h3 className="text-yellow-400 font-bold mb-3">
            Pré-visualização da Fatura
          </h3>

          <div
            ref={invoiceRef}
            className="bg-white text-black p-6 rounded-xl"
          >
            <div className="flex justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="text-blue-600 text-2xl font-extrabold">
                  FATURA
                </h1>
                <p>
                  <b>Empresa:</b> IKA SU
                </p>
                <p>
                  <b>Contactos:</b> +244 900 000 000
                </p>
                <p>
                  <b>Sobre:</b> Sistema Profissional de Venda
                </p>
              </div>
              <div className="text-right">
                <p>
                  <b>Código:</b>{" "}
                  <input
                    className="text-black border px-1"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                  />
                </p>
                <p>
                  <b>Data:</b> {hoje}
                </p>
                <p>
                  <b>Pagamento:</b> {pagamento}
                </p>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-slate-100">Designação</th>
                  <th className="border p-2 bg-slate-100">Qtd</th>
                  <th className="border p-2 bg-slate-100">Preço</th>
                  <th className="border p-2 bg-slate-100">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="border p-2">{it.designacao}</td>
                    <td className="border p-2 text-center">{it.qtd}</td>
                    <td className="border p-2 text-right">{fmt(it.preco)}</td>
                    <td className="border p-2 text-right">
                      {fmt(it.preco * it.qtd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right mt-4 space-y-1">
              <p>
                <b>Total Bruto:</b> {fmt(totalBruto)}
              </p>
              <p>
                <b>Mão de Obra:</b> {fmt(Number(maoObra || 0))}
              </p>
              <p>
                <b>Transporte:</b> {fmt(Number(transporte || 0))}
              </p>
              <p className="text-lg font-bold text-blue-700">
                Total: {fmt(total)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={guardar}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold"
            >
              Guardar
            </button>
            <button
              onClick={imprimir}
              className="px-5 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 font-bold"
            >
              Imprimir
            </button>
            <button
              onClick={guardarPDF}
              className="px-5 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 font-bold"
            >
              Guardar como PDF
            </button>
          </div>
        </section>
      </div>
      )}

      <footer className="text-center text-slate-400 mt-8">
        Desenvolvido para IKA SU © 2026
      </footer>
    </div>
  );
}

function Index() {
  const [logged, setLogged] = useState(false);
  return logged ? <Sistema /> : <Login onLogin={() => setLogged(true)} />;
}
