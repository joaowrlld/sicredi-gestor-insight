import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const MatrizRealocacao: React.FC = () => {
  const { gestores, associados, seedMockData, realocarAssociados, dimensionamento } = useData();
  const [agencia, setAgencia] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [originalMatrix, setOriginalMatrix] = useState<Record<string, Record<string, number>>>({});

  const agencias = useMemo(() => Array.from(new Set(gestores.map((g) => g.agencia))).sort(), [gestores]);

  const gestoresNaAgencia = useMemo(() => (agencia ? gestores.filter((g) => g.agencia === agencia) : []), [gestores, agencia]);

  const subsegmentos = useMemo(() => {
    if (!agencia) return [] as string[];
    // Collect segmentos handled by gestores in the agency
    const segmentos = new Set<string>();
    gestoresNaAgencia.forEach((g) => segmentos.add(g.segmento));
    // From dimensionamento, get all subsegmentos for those segmentos
    const subs: Set<string> = new Set();
    dimensionamento.forEach((d) => {
      if (segmentos.has(d.segmento)) subs.add(d.subsegmento as string);
    });
    return Array.from(subs).sort();
  }, [agencia, gestoresNaAgencia, dimensionamento]);

  // Initialize matrix from original counts when agency changes
  useEffect(() => {
    if (!agencia) {
      setMatrix({});
      setOriginalMatrix({});
      return;
    }
    const init: Record<string, Record<string, number>> = {};
    gestoresNaAgencia.forEach((g) => {
      init[g.id] = {};
      subsegmentos.forEach((s) => (init[g.id][s] = 0));
    });
    associados.forEach((a) => {
      const g = gestoresNaAgencia.find((gg) => gg.id === a.gestorId);
      if (!g) return;
      const s = a.subsegmento || "-";
      init[g.id][s] = (init[g.id][s] || 0) + 1;
    });
    setMatrix(init);
    setOriginalMatrix(JSON.parse(JSON.stringify(init)));
  }, [agencia, gestoresNaAgencia, subsegmentos, associados]);

  const handleCellChange = (gestorId: string, sub: string, value: number) => {
    setMatrix((prev) => ({ ...prev, [gestorId]: { ...(prev[gestorId] || {}), [sub]: value } }));
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [movesPreview, setMovesPreview] = useState<Array<{ from: string; to: string; sub: string; count: number }>>([]);

  const computeMoves = () => {
    if (!agencia) return [] as any[];
    const moves: { from: string; to: string; sub: string; count: number }[] = [];
    for (const sub of subsegmentos) {
      const deltas: Record<string, number> = {};
      gestoresNaAgencia.forEach((g) => {
        const original = originalMatrix[g.id]?.[sub] ?? 0;
        const desired = matrix[g.id]?.[sub] ?? 0;
        deltas[g.id] = desired - original;
      });
      const sources: { id: string; available: number }[] = [];
      const sinks: { id: string; need: number }[] = [];
      Object.entries(deltas).forEach(([id, d]) => {
        if (d < 0) sources.push({ id, available: -d });
        if (d > 0) sinks.push({ id, need: d });
      });
      let si = 0;
      let ti = 0;
      while (si < sources.length && ti < sinks.length) {
        const take = Math.min(sources[si].available, sinks[ti].need);
        moves.push({ from: sources[si].id, to: sinks[ti].id, sub, count: take });
        sources[si].available -= take;
        sinks[ti].need -= take;
        if (sources[si].available === 0) si++;
        if (sinks[ti].need === 0) ti++;
      }
    }
    return moves;
  };

  const applyMatrix = () => {
    // execute the preview moves
    for (const move of movesPreview) {
      if (move.count <= 0) continue;
      const candidates = associados.filter((a) => a.gestorId === move.from && (a.subsegmento || "-") === move.sub);
      const ids = candidates.slice(0, move.count).map((c) => c.id);
      if (ids.length < move.count) {
        toast({ title: 'Erro', description: `Gestor ${move.from} não tem associados suficientes em ${move.sub}`, variant: 'destructive' });
        return;
      }
      realocarAssociados(ids, move.to, 'Realocação matriz');
    }
    toast({ title: 'Matriz aplicada', description: 'Realocações executadas.' });
    setPreviewOpen(false);
  };
  
  // Preview Dialog JSX will render below

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-4 w-full">
            <div>
              <CardTitle className="flex items-center gap-2">Matriz de Realocação</CardTitle>
              <CardDescription>Grade de gestores x subsegmentos (visual similar)</CardDescription>
            </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" onClick={() => seedMockData && seedMockData()}>Carregar mock</Button>
                <Button variant="secondary" onClick={() => setEditing((s) => !s)}>{editing ? 'Bloquear' : 'Editar Valores'}</Button>
                <Button onClick={() => { const moves = computeMoves(); setMovesPreview(moves); setPreviewOpen(true); }} className="bg-gradient-sicredi">Salvar</Button>
                <Button variant="destructive" onClick={() => { /* reset matrix to original computed state */ setAgencia(null); setAgencia(agencia); }}>Resetar</Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-1">
              <Label>Agência</Label>
              <Select value={agencia ?? ""} onValueChange={(v) => setAgencia(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione agência" />
                </SelectTrigger>
                <SelectContent>
                  {agencias.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-4 text-sm">
                <p className="font-medium">Associados na Agência: {gestoresNaAgencia.reduce((s, g) => s + (g.associadosAtuais || 0), 0)}</p>
                <div className="mt-2">
                  {subsegmentos.map((s) => (
                    <div key={s} className="text-xs text-muted-foreground flex justify-between"><span>{s}</span><span>{gestoresNaAgencia.reduce((sum, g) => sum + (matrix[g.id]?.[s] ?? 0), 0)}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-5 overflow-auto">
              <div className="min-w-[900px] overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border">Subsegmento</th>
                      {gestoresNaAgencia.map((g) => (
                      <th key={g.id} className="p-2 border text-center align-top">
                        <div className="font-medium">{g.nome}</div>
                        <div className="text-xs text-muted-foreground">{g.associadosAtuais}</div>
                      </th>
                    ))}
                    <th className="p-2 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {subsegmentos.map((s) => (
                    <tr key={s} className="odd:bg-muted/5">
                      <td className="p-2 border align-top w-40">
                        <div className="font-medium">{s}</div>
                        <div className="text-xs text-muted-foreground">limite</div>
                      </td>
                      {gestoresNaAgencia.map((g) => {
                        const value = matrix[g.id]?.[s] ?? 0;
                        // limit comes from dimensionamento by subsegmento
                        const dim = dimensionamento.find((d) => d.subsegmento === s as any);
                        const limit = dim?.limiteIdeal ?? g.limiteIdeal ?? 1;
                        const percent = limit > 0 ? value / limit : 0;
                        return (
                          <td key={g.id + s} className="p-2 border align-top">
                            <div className="w-36 h-28 mx-auto flex flex-col items-center justify-center shadow-sm rounded bg-muted/50">
                              {editing ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={value}
                                  onChange={(e) => handleCellChange(g.id, s, Number(e.target.value || 0))}
                                  className="w-full text-center text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary"
                                />
                              ) : (
                                <div className="text-2xl font-bold leading-none">{value === 0 ? '-' : value}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">{(percent * 100).toFixed(2)}%</div>
                              <div className="text-xs text-muted-foreground mt-1">lim: {limit}</div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 border text-right font-medium">{gestoresNaAgencia.reduce((sum, g) => sum + (matrix[g.id]?.[s] ?? 0), 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="p-2 border font-medium">Total por Gestor</td>
                    {gestoresNaAgencia.map((g) => {
                      const total = subsegmentos.reduce((sum, s) => sum + (matrix[g.id]?.[s] ?? 0), 0);
                      const coef = (total / (g.limiteIdeal || 1)) * 100;
                      return (
                        <td key={`total-${g.id}`} className="p-2 border text-center font-semibold">
                          <div className="text-sm font-medium">{total}</div>
                          <div className="text-xs text-success mt-1">Coef {coef.toFixed(2)}%</div>
                        </td>
                      );
                    })}
                    <td className="p-2 border text-right font-semibold">{gestoresNaAgencia.reduce((t, g) => t + subsegmentos.reduce((s, sub) => s + (matrix[g.id]?.[sub] ?? 0), 0), 0)}</td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pré-visualização de Movimentações</DialogTitle>
            <DialogDescription>Revise as movimentações que serão efetuadas antes de confirmar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {movesPreview.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma movimentação detectada.</div>}
            {movesPreview.map((m, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="text-sm">{m.count} associados: {m.from} → {m.to} (sub: {m.sub})</div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Cancelar</Button>
            <Button className="bg-gradient-sicredi" onClick={applyMatrix}>Confirmar e Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatrizRealocacao;
