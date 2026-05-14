import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import logoUrl from "@/assets/logo-kamuengo.jpg";
import { PRODUTOS, type Produto } from "@/data/produtos";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/")({
  component: Index,
});

type Item = { designacao: string; preco: number; qtd: number };
type Fatura = {
  codigo: string;
  data: string;
  hora: string;
  nome: string;
  localidade: string;
  nif: string;
  servico: string;
  pagamento: string;
  items: Item[];
  maoObra: number;
  transporte: number;
  total: number;
};

const LS_SITE_ACCESS = "kamuengo_site_access_ok";
const SITE_ACCESS_CODE = "KAMUENGO2026";

const fmt = (n: number) => `${n.toLocaleString("pt-PT")} Kz`;

// =============== Login ===============
function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setErr("Conta criada! Verifique o seu email para confirmar e depois entre.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-700 to-blue-900 overflow-hidden p-4">
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80')",
          opacity: 0.15,
        }}
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm bg-gradient-to-br from-blue-700/90 to-blue-900/90 backdrop-blur p-8 rounded-3xl text-center shadow-2xl"
      >
        <img
          src={logoUrl}
          alt="KAMUENGO LDA"
          className="w-24 h-24 mx-auto mb-4 rounded-full bg-white object-contain p-2"
        />
        <h2 className="text-white text-xl font-bold mb-6">KAMUENGO LDA</h2>
        <input
          className="w-full p-3 my-2 rounded-lg bg-white text-slate-900 placeholder-slate-500"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full p-3 my-2 rounded-lg bg-white text-slate-900 placeholder-slate-500"
          type="password"
          placeholder="Senha"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
          minLength={6}
        />
        {err && <p className="text-yellow-300 text-sm mt-2">{err}</p>}
        <button disabled={loading} className="w-full p-3 mt-4 bg-yellow-400 text-black rounded-lg font-bold text-lg disabled:opacity-50">
          {loading ? "..." : mode === "signin" ? "ENTRAR" : "CRIAR CONTA"}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); }}
          className="w-full mt-3 text-yellow-200 text-xs underline"
        >
          {mode === "signin" ? "Criar nova conta" : "Já tenho conta — entrar"}
        </button>
      </form>
    </div>
  );
}

// =============== Barcode Scanner Modal ===============
function ScannerModal({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const containerId = "kamuengo-scanner";
  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let stopped = false;
    (async () => {
      try {
        const mod = await import("html5-qrcode");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Html5Qrcode: any = (mod as any).Html5Qrcode;
        scanner = new Html5Qrcode(containerId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (scanner as any).start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decoded: string) => {
            if (stopped) return;
            stopped = true;
            onDetected(decoded);
          },
          () => {},
        );
      } catch (e) {
        console.error("Scanner error", e);
        alert("Não foi possível aceder à câmera.");
        onClose();
      }
    })();
    return () => {
      stopped = true;
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => scanner?.clear());
      }
    };
  }, [onDetected, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-yellow-400 font-bold">Ler Código de Barras</h3>
          <button onClick={onClose} className="text-white text-2xl leading-none">×</button>
        </div>
        <div id={containerId} className="w-full rounded-lg overflow-hidden bg-black" />
        <p className="text-slate-300 text-xs mt-3 text-center">
          Aponte a câmera para o código de barras
        </p>
      </div>
    </div>
  );
}

// =============== Novo Produto Modal ===============
function NovoProdutoModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (p: Produto) => void;
  initial?: Produto;
}) {
  const [codigo, setCodigo] = useState(initial?.codigo ?? "");
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [preco, setPreco] = useState<number | "">(initial?.preco ?? "");
  const [qtd, setQtd] = useState<number | "">(initial?.qtd ?? 0);
  const isEdit = !!initial;

  const submit = () => {
    if (!nome.trim() || !preco) {
      alert("Nome e preço são obrigatórios.");
      return;
    }
    const cod = codigo.trim() || String(Date.now()).slice(-13);
    onSave({ codigo: cod, nome: nome.trim(), preco: Number(preco), qtd: Number(qtd || 0) });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-5 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-yellow-400 font-bold">{isEdit ? "Alterar Produto" : "Cadastrar Novo Produto"}</h3>
          <button onClick={onClose} className="text-white text-2xl leading-none">×</button>
        </div>
        <input
          className="w-full p-3 my-2 rounded-lg bg-white text-slate-900 placeholder-slate-500"
          placeholder="Código de barras (opcional)"
          value={codigo}
          disabled={isEdit}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <input
          className="w-full p-3 my-2 rounded-lg bg-white text-slate-900 placeholder-slate-500"
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="w-full p-3 my-2 rounded-lg bg-white text-slate-900 placeholder-slate-500"
          type="number"
          placeholder="Preço (Kz)"
          value={preco}
          onChange={(e) => setPreco(e.target.value === "" ? "" : Number(e.target.value))}
        />
        <input
          className="w-full p-3 my-2 rounded-lg bg-white text-slate-900 placeholder-slate-500"
          type="number"
          placeholder="Quantidade em stock"
          value={qtd}
          onChange={(e) => setQtd(e.target.value === "" ? "" : Number(e.target.value))}
        />
        <button
          onClick={submit}
          className="w-full p-3 mt-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold"
        >
          {isEdit ? "Guardar Alterações" : "Guardar Produto"}
        </button>
      </div>
    </div>
  );
}

// =============== PDF builder (reusable) ===============
async function gerarPDFDoc(f: Fatura) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.jspdf?.jsPDF) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = () => res();
      s.onerror = () => rej();
      document.body.appendChild(s);
    });
  }
  const JSPDF = w.jspdf.jsPDF;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = new JSPDF();
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoUrl;
    await new Promise<void>((res) => {
      if (img.complete) return res();
      img.onload = () => res();
      img.onerror = () => res();
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 300;
    canvas.height = img.naturalHeight || 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 14, 10, 30, 30);
    }
  } catch {
    /* ignore */
  }
  let y = 20;
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text("FATURA - KAMUENGO LDA", 50, y);
  y += 7;
  doc.setFontSize(11);
  doc.text("NIF: 5000990760", 50, y);
  y = 45;
  doc.setTextColor(0);
  doc.text(`Código: ${f.codigo}`, 14, y);
  doc.text(`Data: ${f.data}`, 140, y);
  y += 6;
  doc.text(`Hora: ${f.hora}`, 140, y);
  y += 6;
  doc.text(`Pagamento: ${f.pagamento}`, 14, y);
  y += 6;
  doc.text(`Nome: ${f.nome}`, 14, y);
  y += 6;
  doc.text(`Localidade: ${f.localidade}`, 14, y);
  y += 6;
  doc.text(`NIF: ${f.nif}`, 14, y);
  y += 6;
  doc.text(`Serviço: ${f.servico}`, 14, y);
  y += 10;
  doc.text("Designação", 14, y);
  doc.text("Qtd", 100, y);
  doc.text("Preço", 120, y);
  doc.text("Total", 160, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 6;
  f.items.forEach((it) => {
    doc.text(it.designacao.slice(0, 40), 14, y);
    doc.text(String(it.qtd), 100, y);
    doc.text(fmt(it.preco), 120, y);
    doc.text(fmt(it.preco * it.qtd), 160, y);
    y += 6;
  });
  y += 8;
  doc.text(`Mão de Obra: ${fmt(f.maoObra)}`, 130, y);
  y += 6;
  doc.text(`Transporte: ${fmt(f.transporte)}`, 130, y);
  y += 6;
  doc.setFontSize(13);
  doc.text(`TOTAL: ${fmt(f.total)}`, 130, y);
  return doc;
}

async function partilharFatura(f: Fatura) {
  const doc = await gerarPDFDoc(f);
  const blob: Blob = doc.output("blob");
  const file = new File([blob], `${f.codigo}.pdf`, { type: "application/pdf" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav: any = navigator;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `Fatura ${f.codigo}`, text: "Fatura KAMUENGO LDA" });
      return;
    } catch {
      /* user cancelled */
      return;
    }
  }
  // fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${f.codigo}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
  alert("Partilha não suportada — PDF transferido.");
}

async function imprimirPDF(f: Fatura) {
  const doc = await gerarPDFDoc(f);
  doc.autoPrint?.();
  const url = doc.output("bloburl");
  const win = window.open(url, "_blank");
  if (!win) alert("Permita popups para imprimir.");
}

// =============== Sistema ===============
function Sistema() {
  const [view, setView] = useState<"fatura" | "lista">("fatura");
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [selecionada, setSelecionada] = useState<Fatura | null>(null);

  // Produtos — agora vivem na nuvem, partilhados entre dispositivos
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [importando, setImportando] = useState(false);

  const recarregarProdutos = async () => {
    setCarregandoProdutos(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("codigo,nome,preco,qtd")
      .order("nome", { ascending: true });
    if (error) {
      console.error("Erro a carregar produtos:", error);
      alert("Erro a carregar produtos: " + error.message);
    } else {
      setTodosProdutos((data ?? []).map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        preco: Number(p.preco),
        qtd: p.qtd,
      })));
    }
    setCarregandoProdutos(false);
  };

  useEffect(() => {
    recarregarProdutos();
    // realtime: sincronização entre dispositivos
    const ch = supabase
      .channel("produtos-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "produtos" }, () => {
        recarregarProdutos();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const importarCatalogoBase = async () => {
    if (!confirm(`Importar ${PRODUTOS.length} produtos do catálogo base para a nuvem?`)) return;
    setImportando(true);
    // Lotes de 500
    const rows = PRODUTOS.map((p) => ({
      codigo: p.codigo, nome: p.nome, preco: p.preco, qtd: p.qtd,
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from("produtos").upsert(chunk, { onConflict: "codigo" });
      if (error) {
        alert("Erro na importação: " + error.message);
        setImportando(false);
        return;
      }
    }
    setImportando(false);
    alert("Catálogo importado!");
    recarregarProdutos();
  };
  const [filtroProd, setFiltroProd] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showNovoProd, setShowNovoProd] = useState(false);
  const [editProd, setEditProd] = useState<Produto | null>(null);

  const produtosFiltrados = useMemo(() => {
    const t = filtroProd.trim().toLowerCase();
    if (!t) return todosProdutos.slice(0, 200);
    return todosProdutos
      .filter((p) => p.codigo.includes(t) || p.nome.toLowerCase().includes(t))
      .slice(0, 200);
  }, [todosProdutos, filtroProd]);

  const salvarNovoProduto = async (p: Produto) => {
    const { error } = await supabase.from("produtos").insert({
      codigo: p.codigo, nome: p.nome, preco: p.preco, qtd: p.qtd,
    });
    if (error) { alert("Erro: " + error.message); return; }
    setShowNovoProd(false);
    recarregarProdutos();
  };

  const eliminarProduto = async (p: Produto) => {
    if (!confirm(`Eliminar "${p.nome}"?`)) return;
    const { error } = await supabase.from("produtos").delete().eq("codigo", p.codigo);
    if (error) { alert("Erro: " + error.message); return; }
    recarregarProdutos();
  };

  const alterarProduto = (p: Produto) => setEditProd(p);

  const salvarAlteracao = async (p: Produto) => {
    const { error } = await supabase
      .from("produtos")
      .update({ nome: p.nome, preco: p.preco, qtd: p.qtd })
      .eq("codigo", p.codigo);
    if (error) { alert("Erro: " + error.message); return; }
    setEditProd(null);
    recarregarProdutos();
  };

  // Form de fatura
  const [items, setItems] = useState<Item[]>([]);
  const [designacao, setDesignacao] = useState("");
  const [preco, setPreco] = useState<number | "">("");
  const [qtd, setQtd] = useState<number | "">(1);
  const [pagamento, setPagamento] = useState("Dinheiro");
  const [maoObra, setMaoObra] = useState<number | "">(0);
  const [transporte, setTransporte] = useState<number | "">(0);
  const [nome, setNome] = useState("");
  const [localidade, setLocalidade] = useState("");
  const [nif, setNif] = useState("");
  const [servico, setServico] = useState("");

  const aplicarProduto = (p: Produto) => {
    setDesignacao(p.nome);
    setPreco(p.preco);
    setFiltroProd("");
  };

  const onScan = (code: string) => {
    setShowScanner(false);
    const p = todosProdutos.find((x) => x.codigo === code);
    if (p) aplicarProduto(p);
    else {
      setFiltroProd(code);
      alert(`Código ${code} não encontrado no banco.`);
    }
  };

  const proximoCodigo = (n: number) => String(Math.min(n, 9999)).padStart(4, "0");
  const [codigo, setCodigo] = useState("0001");

  const calcularProximoCodigo = async () => {
    const { count } = await supabase
      .from("faturas")
      .select("*", { count: "exact", head: true });
    setCodigo(proximoCodigo((count ?? 0) + 1));
  };

  useEffect(() => { calcularProximoCodigo(); }, []);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const hoje = new Date().toLocaleDateString("pt-PT");
  const hora = new Date().toLocaleTimeString("pt-PT");

  const totalBruto = useMemo(() => items.reduce((s, i) => s + i.preco * i.qtd, 0), [items]);
  const total = totalBruto + Number(maoObra || 0) + Number(transporte || 0);

  const addItem = () => {
    if (!designacao || !preco || !qtd) return;
    setItems([...items, { designacao, preco: Number(preco), qtd: Number(qtd) }]);
    setDesignacao("");
    setPreco("");
    setQtd(1);
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const faturaAtual = (): Fatura => ({
    codigo,
    data: hoje,
    hora,
    nome,
    localidade,
    nif,
    pagamento,
    servico,
    items,
    maoObra: Number(maoObra || 0),
    transporte: Number(transporte || 0),
    total,
  });

  const guardar = async () => {
    const dados = faturaAtual();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("faturas").insert({
      codigo: dados.codigo,
      data: dados.data,
      hora: dados.hora,
      nome: dados.nome,
      localidade: dados.localidade,
      nif: dados.nif,
      servico: dados.servico,
      pagamento: dados.pagamento,
      items: dados.items,
      mao_obra: dados.maoObra,
      transporte: dados.transporte,
      total: dados.total,
      criado_por: userData.user?.id ?? null,
    });
    if (error) { alert("Erro ao guardar fatura: " + error.message); return; }
    alert("Fatura guardada na nuvem!");
    calcularProximoCodigo();
  };

  const imprimir = () => {
    const w = window.open("", "", "width=800,height=900");
    if (!w || !invoiceRef.current) return;
    w.document.write(
      `<html><head><title>Fatura ${codigo}</title><style>
      body{font-family:Arial;padding:20px;color:#000}
      table{width:100%;border-collapse:collapse;margin-top:15px}
      th,td{border:1px solid #333;padding:8px;text-align:center}
      h1{color:#2563eb}.right{text-align:right}
      img{width:3cm;height:3cm;object-fit:contain}
      </style></head><body>${invoiceRef.current.innerHTML}</body></html>`,
    );
    w.document.close();
    w.print();
  };

  const abrirLista = async () => {
    const { data, error } = await supabase
      .from("faturas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { alert("Erro: " + error.message); return; }
    setFaturas((data ?? []).map((f) => ({
      codigo: f.codigo, data: f.data, hora: f.hora, nome: f.nome,
      localidade: f.localidade, nif: f.nif, servico: f.servico,
      pagamento: f.pagamento, items: (f.items as unknown as Item[]) ?? [],
      maoObra: Number(f.mao_obra), transporte: Number(f.transporte), total: Number(f.total),
    })));
    setSelecionada(null);
    setView("lista");
  };

  // Form input shared style — fundo branco + texto escuro + borda visível
  const inputCls =
    "w-full p-3 mt-2 rounded-lg bg-white text-slate-900 placeholder-slate-500 border border-slate-300 focus:border-blue-500 focus:outline-none";

  return (
    <div className="min-h-screen p-3 md:p-5 bg-slate-900 text-white">
      <header className="flex items-center justify-between bg-slate-950 p-3 md:p-5 rounded-2xl mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="KAMUENGO LDA"
            className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white object-contain p-1"
          />
          <div>
            <h1 className="text-lg md:text-2xl font-bold">KAMUENGO LDA</h1>
            <p className="text-slate-300 text-xs md:text-sm">
              Sistema de Venda &amp; Faturação
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
          <button
            onClick={() => (view === "fatura" ? abrirLista() : setView("fatura"))}
            className="px-3 py-2 rounded-lg bg-yellow-400 text-black font-bold"
          >
            {view === "fatura" ? "Ver Faturas" : "Nova Fatura"}
          </button>
          <p className="text-slate-300">{hoje}</p>
          <p className="text-slate-300">{hora}</p>
        </div>
      </header>

      {view === "lista" ? (
        <section className="bg-slate-800 p-3 md:p-5 rounded-2xl">
          <h3 className="text-yellow-400 font-bold mb-3">Faturas Guardadas</h3>
          {faturas.length === 0 ? (
            <p className="text-slate-400">Nenhuma fatura guardada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr>
                    <th className="bg-slate-700 p-2 text-left">Código</th>
                    <th className="bg-slate-700 p-2 text-left">Data</th>
                    <th className="bg-slate-700 p-2 text-left">Hora</th>
                    <th className="bg-slate-700 p-2 text-right">Total</th>
                    <th className="bg-slate-700 p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map((f, i) => (
                    <tr key={i} className="border-b border-slate-700">
                      <td className="p-2">{f.codigo}</td>
                      <td className="p-2">{f.data}</td>
                      <td className="p-2">{f.hora}</td>
                      <td className="p-2 text-right">{fmt(f.total)}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <button
                            onClick={() => setSelecionada(f)}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 font-bold text-xs"
                          >
                            Abrir
                          </button>
                          <button
                            onClick={() => imprimirPDF(f)}
                            className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 font-bold text-xs"
                          >
                            Imprimir
                          </button>
                          <button
                            onClick={() => partilharFatura(f)}
                            className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 font-bold text-xs"
                          >
                            Partilhar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selecionada && (
            <div className="bg-white text-black p-4 md:p-6 rounded-xl mt-5">
              <div className="flex justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="KAMUENGO LDA" className="w-16 h-16 object-contain" />
                  <div>
                    <h1 className="text-blue-600 text-2xl font-extrabold">FATURA</h1>
                    <p><b>Empresa:</b> KAMUENGO LDA</p>
                    <p className="text-blue-600 font-semibold">NIF: 5000990760</p>
                    <p><b>Nome:</b> {selecionada.nome}</p>
                    <p><b>Localidade:</b> {selecionada.localidade}</p>
                    <p><b>NIF Cliente:</b> {selecionada.nif}</p>
                    <p><b>Serviço:</b> {selecionada.servico}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p><b>Código:</b> {selecionada.codigo}</p>
                  <p><b>Data:</b> {selecionada.data}</p>
                  <p><b>Hora:</b> {selecionada.hora}</p>
                  <p><b>Pagamento:</b> {selecionada.pagamento}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[400px]">
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
              </div>
              <div className="text-right mt-4 space-y-1">
                <p><b>Mão de Obra:</b> {fmt(selecionada.maoObra)}</p>
                <p><b>Transporte:</b> {fmt(selecionada.transporte)}</p>
                <p className="text-lg font-bold text-blue-700">Total: {fmt(selecionada.total)}</p>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Catálogo de Produtos — estilo lista scroll */}
          <section className="bg-slate-800 p-3 md:p-4 rounded-2xl lg:col-span-1 order-1">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="text-yellow-400 font-bold">Catálogo</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowScanner(true)}
                  title="Scanner de câmera"
                  className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  📷 Scan
                </button>
                <button
                  onClick={() => setShowNovoProd(true)}
                  className="px-2 py-1 text-xs rounded bg-green-500 hover:bg-green-600 font-bold"
                >
                  + Novo
                </button>
              </div>
            </div>
            <input
              className={inputCls + " mt-0"}
              placeholder="Pesquisar por nome ou código…"
              value={filtroProd}
              onChange={(e) => setFiltroProd(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-2">
              {todosProdutos.length} produtos · mostrando {produtosFiltrados.length}
            </p>
            <ul className="mt-2 max-h-[420px] overflow-y-auto divide-y divide-slate-700 rounded-lg bg-slate-900">
              {produtosFiltrados.map((p) => (
                <li
                  key={p.codigo}
                  className="px-3 py-2 hover:bg-slate-700 text-sm"
                >
                  <div
                    onClick={() => aplicarProduto(p)}
                    className="flex justify-between gap-2 cursor-pointer"
                  >
                    <span className="truncate font-medium text-white">{p.nome}</span>
                    <span className="text-blue-300 whitespace-nowrap">{fmt(p.preco)}</span>
                  </div>
                  <div
                    onClick={() => aplicarProduto(p)}
                    className="flex justify-between text-xs text-slate-400 cursor-pointer"
                  >
                    <span>{p.codigo}</span>
                    <span className={p.qtd > 0 ? "text-green-400" : "text-red-400"}>
                      stock {p.qtd}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); alterarProduto(p); }}
                      className="flex-1 px-2 py-1 text-xs rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                    >
                      ✎ Alterar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); eliminarProduto(p); }}
                      className="flex-1 px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700 font-bold"
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </li>
              ))}
              {produtosFiltrados.length === 0 && (
                <li className="px-3 py-4 text-center text-slate-400 text-sm">
                  Nenhum produto encontrado
                </li>
              )}
            </ul>
          </section>

          {/* Formulário */}
          <section className="bg-slate-100 text-slate-900 p-3 md:p-5 rounded-2xl lg:col-span-1 order-2">
            <h3 className="text-blue-700 font-bold mb-3">Cadastro de Venda</h3>
            <input className={inputCls} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <input className={inputCls} placeholder="Localidade" value={localidade} onChange={(e) => setLocalidade(e.target.value)} />
            <input className={inputCls} placeholder="NIF" value={nif} onChange={(e) => setNif(e.target.value)} />
            <input className={inputCls} placeholder="Serviço" value={servico} onChange={(e) => setServico(e.target.value)} />
            <input className={inputCls} placeholder="Designação" value={designacao} onChange={(e) => setDesignacao(e.target.value)} />
            <input
              className={inputCls}
              type="number"
              placeholder="Preço unitário (Kz)"
              value={preco}
              onChange={(e) => setPreco(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <input
              className={inputCls}
              type="number"
              placeholder="Quantidade"
              value={qtd}
              onChange={(e) => setQtd(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <input
              className={inputCls}
              type="number"
              placeholder="Mão de obra (Kz)"
              value={maoObra}
              onChange={(e) => setMaoObra(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <input
              className={inputCls}
              type="number"
              placeholder="Transporte (Kz)"
              value={transporte}
              onChange={(e) => setTransporte(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <select
              className={inputCls}
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
            >
              <option>Dinheiro</option>
              <option>TPA</option>
              <option>Transferência Bancária</option>
            </select>

            <button
              onClick={addItem}
              className="mt-4 w-full px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 font-bold text-white"
            >
              Adicionar Item à Fatura
            </button>

            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-slate-300 p-2">Designação</th>
                    <th className="bg-slate-300 p-2">Preço</th>
                    <th className="bg-slate-300 p-2">Qtd</th>
                    <th className="bg-slate-300 p-2">Total</th>
                    <th className="bg-slate-300 p-2">—</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-3 text-slate-500 text-center">
                        Nenhum item adicionado
                      </td>
                    </tr>
                  )}
                  {items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-300">
                      <td className="p-2">{it.designacao}</td>
                      <td className="p-2">{fmt(it.preco)}</td>
                      <td className="p-2">{it.qtd}</td>
                      <td className="p-2">{fmt(it.preco * it.qtd)}</td>
                      <td className="p-2">
                        <button onClick={() => removeItem(i)} className="text-red-600 hover:text-red-800">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pré-visualização */}
          <section className="bg-slate-800 p-3 md:p-5 rounded-2xl lg:col-span-1 order-3">
            <h3 className="text-yellow-400 font-bold mb-3">Pré-visualização da Fatura</h3>
            <div ref={invoiceRef} className="bg-white text-black p-4 md:p-6 rounded-xl text-sm">
              <div className="flex justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-start gap-3">
                  <img src={logoUrl} alt="KAMUENGO LDA" className="w-16 h-16 object-contain" />
                  <div>
                    <h1 className="text-blue-600 text-xl font-extrabold">FATURA</h1>
                    <p className="text-blue-600 font-semibold">NIF: 5000990760</p>
                    <p><b>Empresa:</b> KAMUENGO LDA</p>
                    <p><b>Contactos:</b> +244 946 785 479</p>
                    <p><b>Nome:</b> {nome}</p>
                    <p><b>Localidade:</b> {localidade}</p>
                    <p><b>NIF Cliente:</b> {nif}</p>
                    <p><b>Serviço:</b> {servico}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p><b>Código:</b> {codigo}</p>
                  <p><b>Data:</b> {hoje}</p>
                  <p><b>Hora:</b> {hora}</p>
                  <p><b>Pagamento:</b> {pagamento}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
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
                        <td className="border p-2 text-right">{fmt(it.preco * it.qtd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-3 space-y-1">
                <p><b>Total Bruto:</b> {fmt(totalBruto)}</p>
                <p><b>Mão de Obra:</b> {fmt(Number(maoObra || 0))}</p>
                <p><b>Transporte:</b> {fmt(Number(transporte || 0))}</p>
                <p className="text-lg font-bold text-blue-700">Total: {fmt(total)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <button onClick={guardar} className="px-3 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-sm">
                Guardar
              </button>
              <button onClick={imprimir} className="px-3 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 font-bold text-sm">
                Imprimir
              </button>
              <button onClick={() => gerarPDFDoc(faturaAtual()).then((d) => d.save(`${codigo}.pdf`))} className="px-3 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 font-bold text-sm">
                PDF
              </button>
              <button onClick={() => partilharFatura(faturaAtual())} className="px-3 py-3 rounded-lg bg-green-600 hover:bg-green-700 font-bold text-sm">
                Partilhar
              </button>
            </div>
          </section>
        </div>
      )}

      <footer className="text-center text-slate-400 mt-8 text-sm">
        Desenvolvido por KAMUENGO LDA © 2026
      </footer>

      {showScanner && <ScannerModal onDetected={onScan} onClose={() => setShowScanner(false)} />}
      {showNovoProd && <NovoProdutoModal onClose={() => setShowNovoProd(false)} onSave={salvarNovoProduto} />}
      {editProd && (
        <NovoProdutoModal
          initial={editProd}
          onClose={() => setEditProd(null)}
          onSave={salvarAlteracao}
        />
      )}
    </div>
  );
}

function SiteAccessGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean>(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(LS_SITE_ACCESS) === "1";
  });
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  if (ok) return <>{children}</>;
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim().toUpperCase() === SITE_ACCESS_CODE) {
            localStorage.setItem(LS_SITE_ACCESS, "1");
            setOk(true);
          } else {
            setErr("Código inválido.");
          }
        }}
        className="bg-slate-800/90 backdrop-blur p-6 rounded-2xl w-full max-w-sm border border-blue-500/30 shadow-2xl"
      >
        <h2 className="text-yellow-400 font-bold text-xl text-center mb-1">KAMUENGO LDA</h2>
        <p className="text-slate-300 text-center text-sm mb-4">Acesso restrito ao Website</p>
        <input
          autoFocus
          type="password"
          placeholder="Código de acesso"
          value={code}
          onChange={(e) => { setCode(e.target.value); setErr(""); }}
          className="w-full p-3 rounded-lg bg-white text-slate-900 placeholder-slate-500"
        />
        {err && <p className="text-red-400 text-xs mt-2 text-center">{err}</p>}
        <button
          type="submit"
          className="w-full mt-4 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white"
        >
          Entrar
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-3">
          Solicite o código ao administrador.
        </p>
      </form>
    </div>
  );
}

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <SiteAccessGate>
      {!ready ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
          A carregar…
        </div>
      ) : session ? (
        <Sistema />
      ) : (
        <Login />
      )}
    </SiteAccessGate>
  );
}
