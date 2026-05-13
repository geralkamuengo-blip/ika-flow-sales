export type Produto = {
  codigo: string; // código de barras (13 dígitos EAN-like)
  nome: string;
  preco: number; // Kz
  qtd: number;
};

const categorias: { nome: string; precoBase: number; unidades: string[] }[] = [
  { nome: "Cimento", precoBase: 8500, unidades: ["25kg", "50kg"] },
  { nome: "Cal Hidratada", precoBase: 3500, unidades: ["20kg", "25kg"] },
  { nome: "Areia Fina", precoBase: 12000, unidades: ["m³"] },
  { nome: "Areia Grossa", precoBase: 13000, unidades: ["m³"] },
  { nome: "Brita", precoBase: 15000, unidades: ["nº1", "nº2", "nº3"] },
  { nome: "Tijolo Furado", precoBase: 180, unidades: ["6F", "8F", "9F", "11F"] },
  { nome: "Tijolo Maciço", precoBase: 220, unidades: ["pequeno", "médio", "grande"] },
  { nome: "Bloco de Cimento", precoBase: 350, unidades: ["10cm", "15cm", "20cm"] },
  { nome: "Telha Cerâmica", precoBase: 450, unidades: ["portuguesa", "romana", "francesa"] },
  { nome: "Telha de Zinco", precoBase: 4500, unidades: ["2m", "3m", "4m", "6m"] },
  { nome: "Chapa de Zinco", precoBase: 5200, unidades: ["0.4mm", "0.5mm", "0.6mm"] },
  { nome: "Vergalhão de Aço", precoBase: 6800, unidades: ["6mm", "8mm", "10mm", "12mm", "16mm", "20mm", "25mm"] },
  { nome: "Arame Recozido", precoBase: 1500, unidades: ["nº16", "nº18"] },
  { nome: "Prego", precoBase: 950, unidades: ["1\"", "2\"", "3\"", "4\"", "5\""] },
  { nome: "Parafuso", precoBase: 250, unidades: ["3x20", "4x30", "5x50", "6x80", "8x100"] },
  { nome: "Bucha Plástica", precoBase: 180, unidades: ["S6", "S8", "S10", "S12"] },
  { nome: "Tubo PVC", precoBase: 1800, unidades: ["20mm", "25mm", "32mm", "40mm", "50mm", "75mm", "100mm", "150mm"] },
  { nome: "Joelho PVC", precoBase: 320, unidades: ["20mm", "25mm", "32mm", "40mm", "50mm", "75mm", "100mm"] },
  { nome: "Tê PVC", precoBase: 380, unidades: ["20mm", "25mm", "32mm", "40mm", "50mm"] },
  { nome: "Cola PVC", precoBase: 1200, unidades: ["75g", "175g", "850g"] },
  { nome: "Torneira", precoBase: 4500, unidades: ["lavatório", "cozinha", "jardim", "parede"] },
  { nome: "Sifão", precoBase: 1800, unidades: ["lavatório", "cozinha", "bidet"] },
  { nome: "Sanita Completa", precoBase: 38000, unidades: ["branca", "bege"] },
  { nome: "Lavatório", precoBase: 22000, unidades: ["coluna", "encastrar", "suspenso"] },
  { nome: "Bidé", precoBase: 18000, unidades: ["branco", "bege"] },
  { nome: "Chuveiro", precoBase: 9500, unidades: ["fixo", "manual", "termostático"] },
  { nome: "Azulejo", precoBase: 3800, unidades: ["20x20", "25x40", "30x60", "45x45", "60x60"] },
  { nome: "Pavimento Cerâmico", precoBase: 4200, unidades: ["30x30", "45x45", "60x60", "80x80"] },
  { nome: "Argamassa Cola", precoBase: 4500, unidades: ["20kg", "25kg"] },
  { nome: "Cimento Cola", precoBase: 4800, unidades: ["20kg", "25kg"] },
  { nome: "Betumadora", precoBase: 1500, unidades: ["branca", "cinza", "bege", "preta"] },
  { nome: "Tinta Plástica", precoBase: 8500, unidades: ["1L", "5L", "15L", "20L"] },
  { nome: "Tinta Esmalte", precoBase: 12000, unidades: ["1L", "5L", "15L"] },
  { nome: "Verniz", precoBase: 9500, unidades: ["1L", "5L"] },
  { nome: "Diluente", precoBase: 3500, unidades: ["1L", "5L", "20L"] },
  { nome: "Pincel", precoBase: 850, unidades: ["1\"", "2\"", "3\"", "4\""] },
  { nome: "Rolo de Pintura", precoBase: 1500, unidades: ["15cm", "20cm", "25cm"] },
  { nome: "Madeira de Construção", precoBase: 9500, unidades: ["2x4", "2x6", "2x8", "4x4"] },
  { nome: "Tábua de Pinho", precoBase: 6500, unidades: ["1m", "2m", "3m", "4m"] },
  { nome: "Contraplacado", precoBase: 18000, unidades: ["6mm", "9mm", "12mm", "18mm"] },
  { nome: "MDF", precoBase: 15000, unidades: ["6mm", "9mm", "12mm", "15mm", "18mm"] },
  { nome: "Porta de Madeira", precoBase: 35000, unidades: ["interior", "exterior", "casa de banho"] },
  { nome: "Janela de Alumínio", precoBase: 65000, unidades: ["1m", "1.5m", "2m"] },
  { nome: "Vidro Liso", precoBase: 4500, unidades: ["3mm", "4mm", "5mm", "6mm"] },
  { nome: "Cabo Elétrico", precoBase: 2800, unidades: ["1.5mm²", "2.5mm²", "4mm²", "6mm²", "10mm²", "16mm²"] },
  { nome: "Disjuntor", precoBase: 3500, unidades: ["10A", "16A", "20A", "25A", "32A", "40A"] },
  { nome: "Interruptor", precoBase: 1200, unidades: ["simples", "duplo", "comutador", "cruzamento"] },
  { nome: "Tomada", precoBase: 1500, unidades: ["simples", "dupla", "schuko", "USB"] },
  { nome: "Lâmpada LED", precoBase: 950, unidades: ["5W", "9W", "12W", "15W", "20W"] },
  { nome: "Calha PVC", precoBase: 850, unidades: ["10x10", "16x16", "20x20", "40x20"] },
  { nome: "Quadro Elétrico", precoBase: 12000, unidades: ["6 módulos", "12 módulos", "24 módulos"] },
  { nome: "Saco de Gesso", precoBase: 2800, unidades: ["20kg", "25kg", "40kg"] },
  { nome: "Placa de Gesso", precoBase: 4500, unidades: ["12.5mm STD", "12.5mm RH", "15mm RF"] },
  { nome: "Perfil de Aço", precoBase: 2500, unidades: ["48x35", "70x35", "90x35"] },
  { nome: "Lã de Rocha", precoBase: 7800, unidades: ["40mm", "50mm", "80mm", "100mm"] },
  { nome: "Impermeabilizante", precoBase: 14000, unidades: ["5L", "10L", "20L"] },
  { nome: "Selante Silicone", precoBase: 1800, unidades: ["transparente", "branco", "preto", "cinza"] },
  { nome: "Espuma de Poliuretano", precoBase: 3500, unidades: ["500ml", "750ml"] },
  { nome: "Fita Isoladora", precoBase: 350, unidades: ["preta", "branca", "vermelha", "azul", "amarela"] },
  { nome: "Fita Métrica", precoBase: 2500, unidades: ["3m", "5m", "8m", "10m"] },
  { nome: "Martelo", precoBase: 4500, unidades: ["pequeno", "médio", "grande"] },
  { nome: "Chave de Fendas", precoBase: 1800, unidades: ["pequena", "média", "grande", "estrela"] },
  { nome: "Alicate", precoBase: 3500, unidades: ["universal", "corte", "bico", "pressão"] },
  { nome: "Serrote", precoBase: 4200, unidades: ["18\"", "22\"", "24\""] },
  { nome: "Berbequim", precoBase: 28000, unidades: ["500W", "750W", "1000W"] },
  { nome: "Rebarbadora", precoBase: 32000, unidades: ["115mm", "125mm", "230mm"] },
  { nome: "Disco de Corte", precoBase: 850, unidades: ["115mm", "125mm", "180mm", "230mm"] },
  { nome: "Carrinho de Mão", precoBase: 18500, unidades: ["80L", "90L", "120L"] },
  { nome: "Pá", precoBase: 3800, unidades: ["bico", "quadrada", "areia"] },
  { nome: "Picareta", precoBase: 5500, unidades: ["pequena", "média", "grande"] },
  { nome: "Enxada", precoBase: 4500, unidades: ["pequena", "média", "grande"] },
  { nome: "Colher de Pedreiro", precoBase: 1800, unidades: ["pequena", "média", "grande"] },
  { nome: "Talocha", precoBase: 2500, unidades: ["plástica", "esponja", "feltro"] },
  { nome: "Nível de Bolha", precoBase: 3800, unidades: ["30cm", "60cm", "100cm", "120cm"] },
  { nome: "Esquadro", precoBase: 2200, unidades: ["20cm", "30cm", "60cm"] },
  { nome: "Linha de Pedreiro", precoBase: 450, unidades: ["50m", "100m"] },
  { nome: "Saco de Areia", precoBase: 850, unidades: ["25kg", "50kg"] },
  { nome: "Saco de Brita", precoBase: 950, unidades: ["25kg", "50kg"] },
];

function gerarCodigo(seed: number): string {
  const base = String(2000000000000 + seed);
  return base.slice(0, 13);
}

function gerarProdutos(): Produto[] {
  const list: Produto[] = [];
  let i = 0;
  let seed = 1;
  while (list.length < 1000) {
    const cat = categorias[i % categorias.length];
    const variante = cat.unidades[Math.floor(i / categorias.length) % cat.unidades.length];
    const ciclo = Math.floor(i / (categorias.length * cat.unidades.length));
    const marca = ["Standard", "Premium", "Económico", "PRO", "Plus", "Master"][ciclo % 6];
    const variacaoPreco = 1 + ((i * 37) % 25) / 100; // 1.00 - 1.24
    const preco = Math.round((cat.precoBase * variacaoPreco) / 50) * 50;
    const qtd = 5 + ((i * 13) % 195); // 5 - 199
    list.push({
      codigo: gerarCodigo(seed++),
      nome: `${cat.nome} ${variante} ${marca}`,
      preco,
      qtd,
    });
    i++;
  }
  return list;
}

export const PRODUTOS: Produto[] = gerarProdutos();

export function buscarProduto(termo: string): Produto | undefined {
  const t = termo.trim().toLowerCase();
  if (!t) return undefined;
  return (
    PRODUTOS.find((p) => p.codigo === t) ||
    PRODUTOS.find((p) => p.nome.toLowerCase() === t) ||
    PRODUTOS.find((p) => p.nome.toLowerCase().includes(t))
  );
}