import { useState, useMemo } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export const RealocacaoAssociados = () => {
  const { gestores, associados, realocarAssociados, seedMockData } = useData();
  const [agenciaSelecionada, setAgenciaSelecionada] = useState<string | null>(null);
  const [editedMatrix, setEditedMatrix] = useState<Record<string, Record<string, number>>>({});
  const [gestorOrigemId, setGestorOrigemId] = useState("");
  const [gestorDestinoId, setGestorDestinoId] = useState("");
  const [associadosSelecionados, setAssociadosSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const gestorOrigem = gestores.find((g) => g.id === gestorOrigemId);
  const gestorDestino = gestores.find((g) => g.id === gestorDestinoId);
  const associadosOrigem = associados.filter((a) => a.gestorId === gestorOrigemId);
  const associadosFiltrados = associadosOrigem.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Build list of agencies from gestores
  const agencias = useMemo(() => {
    const set = new Set<string>();
    gestores.forEach((g) => set.add(g.agencia));
    return Array.from(set).sort();
  }, [gestores]);

  const gestoresNaAgencia = useMemo(() => {
    if (!agenciaSelecionada) return [] as typeof gestores;
    return gestores.filter((g) => g.agencia === agenciaSelecionada);
  }, [gestores, agenciaSelecionada]);

  // Subsegmentos presentes na agência (from associados assigned to gestores of the agency)
  const subsegmentosDaAgencia = useMemo(() => {
    if (!agenciaSelecionada) return [] as string[];
    const gestorIds = new Set(gestoresNaAgencia.map((g) => g.id));
    const set = new Set<string>();
    associados.forEach((a) => {
      if (gestorIds.has(a.gestorId)) set.add(a.subsegmento || "-");
    });
    return Array.from(set).sort();
  }, [agenciaSelecionada, gestoresNaAgencia, associados]);

  const originalCounts = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    gestoresNaAgencia.forEach((g) => {
      map[g.id] = {};
      subsegmentosDaAgencia.forEach((s) => (map[g.id][s] = 0));
    });

    associados.forEach((a) => {
      if (!a.gestorId) return;
      const g = gestores.find((x) => x.id === a.gestorId);
      if (!g || g.agencia !== agenciaSelecionada) return;
      const s = a.subsegmento || "-";
      if (!map[a.gestorId]) map[a.gestorId] = {};
      map[a.gestorId][s] = (map[a.gestorId][s] || 0) + 1;
    });

    return map;
  }, [gestoresNaAgencia, subsegmentosDaAgencia, associados, gestores, agenciaSelecionada]);

  // Initialize editedMatrix when agency changes
  useMemo(() => {
    if (!agenciaSelecionada) {
      setEditedMatrix({});
      return;
    }
    const init: Record<string, Record<string, number>> = {};
    gestoresNaAgencia.forEach((g) => {
      init[g.id] = {};
      subsegmentosDaAgencia.forEach((s) => {
        init[g.id][s] = originalCounts[g.id]?.[s] ?? 0;
      });
    });
    setEditedMatrix(init);
  }, [agenciaSelecionada, gestoresNaAgencia, subsegmentosDaAgencia, originalCounts]);

  const handleCellChange = (gestorId: string, subsegmento: string, value: number) => {
    setEditedMatrix((prev) => ({
      ...prev,
      [gestorId]: {
        ...(prev[gestorId] || {}),
        [subsegmento]: value,
      },
    }));
  };

  const aplicarAlteracoesDaMatriz = async () => {
    if (!agenciaSelecionada) return;

    // For each subsegment, compute deltas per gestor
    const moves: { from: string; to: string; subsegmento: string; count: number }[] = [];

    for (const subsegmento of subsegmentosDaAgencia) {
      const deltas: Record<string, number> = {};
      gestoresNaAgencia.forEach((g) => {
        const original = originalCounts[g.id]?.[subsegmento] ?? 0;
        const desired = editedMatrix[g.id]?.[subsegmento] ?? original;
        deltas[g.id] = desired - original; // positive needs to receive, negative needs to give
      });

      const sources: { id: string; available: number }[] = [];
      const sinks: { id: string; need: number }[] = [];

      Object.entries(deltas).forEach(([id, delta]) => {
        if (delta < 0) sources.push({ id, available: -delta });
        if (delta > 0) sinks.push({ id, need: delta });
      });

      // Greedy match: take from sources to fill sinks
      let si = 0;
      let ti = 0;
      while (si < sources.length && ti < sinks.length) {
        const take = Math.min(sources[si].available, sinks[ti].need);
        moves.push({ from: sources[si].id, to: sinks[ti].id, subsegmento, count: take });
        sources[si].available -= take;
        sinks[ti].need -= take;
        if (sources[si].available === 0) si++;
        if (sinks[ti].need === 0) ti++;
      }
    }

    // Now convert moves into actual associated IDs to move
    const allMoves: { to: string; ids: string[] }[] = [];

    for (const move of moves) {
      if (move.count <= 0) continue;
      // find candidate associados from 'from' with matching subsegment
      const candidates = associados.filter(
        (a) => a.gestorId === move.from && (a.subsegmento || "-") === move.subsegmento
      );
      if (candidates.length < move.count) {
        toast({
          title: 'Não há associados suficientes',
          description: `Gestor ${move.from} não tem ${move.count} associados em ${move.subsegmento}`,
          variant: 'destructive',
        });
        return;
      }
      const ids = candidates.slice(0, move.count).map((c) => c.id);
      const existing = allMoves.find((m) => m.to === move.to);
      if (existing) existing.ids.push(...ids);
      else allMoves.push({ to: move.to, ids });
    }

    // Execute moves per target gestor
    for (const m of allMoves) {
      try {
        realocarAssociados(m.ids, m.to, 'Realocação via matriz');
      } catch (err) {
        console.error('Erro ao realocar via matriz', err);
        toast({ title: 'Erro na realocação', description: String(err), variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Realocação concluída', description: 'Alterações aplicadas com sucesso.' });
  };

  const handleRealocar = () => {
    if (associadosSelecionados.length === 0) {
      toast({
        title: "Selecione associados",
        description: "É necessário selecionar ao menos um associado para realocar",
        variant: "destructive",
      });
      return;
    }

    if (!gestorDestinoId) {
      toast({
        title: "Selecione o gestor destino",
        description: "É necessário selecionar o gestor que receberá os associados",
        variant: "destructive",
      });
      return;
    }

    realocarAssociados(associadosSelecionados, gestorDestinoId, "Realocação manual");
    
    toast({
      title: "Realocação concluída!",
      description: `${associadosSelecionados.length} associado(s) realocado(s) com sucesso`,
    });

    setAssociadosSelecionados([]);
  };

  const novaOcupacaoOrigem = gestorOrigem
    ? gestorOrigem.associadosAtuais - associadosSelecionados.length
    : 0;
  const novaOcupacaoDestino = gestorDestino
    ? gestorDestino.associadosAtuais + associadosSelecionados.length
    : 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Realocação de Associados
          </CardTitle>
          <CardDescription>
            Selecione o gestor origem e destino para realizar a transferência
          </CardDescription>
          <div className="ml-auto">
            <Button size="sm" variant="ghost" onClick={() => seedMockData && seedMockData()}>
              Carregar mock
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Gestor Origem</Label>
              <Select value={gestorOrigemId} onValueChange={setGestorOrigemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nome} ({g.associadosAtuais})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gestor Destino</Label>
              <Select value={gestorDestinoId} onValueChange={setGestorDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {gestores
                    .filter((g) => g.id !== gestorOrigemId)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nome} ({g.associadosAtuais})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {gestorOrigemId && (
            <>
              <div className="space-y-2">
                <Label>Buscar Associados</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome do associado..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">
                    Associados Disponíveis ({associadosFiltrados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {associadosFiltrados.map((associado) => (
                      <div
                        key={associado.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
                      >
                        <Checkbox
                          checked={associadosSelecionados.includes(associado.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAssociadosSelecionados([...associadosSelecionados, associado.id]);
                            } else {
                              setAssociadosSelecionados(
                                associadosSelecionados.filter((id) => id !== associado.id)
                              );
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{associado.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {associado.segmento} - {associado.subsegmento}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Matrix section: select agency and edit allocation per gestor x subsegmento */}
          <div className="space-y-4">
            <Label>Agência</Label>
            <Select value={agenciaSelecionada ?? ""} onValueChange={(v) => setAgenciaSelecionada(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a agência" />
              </SelectTrigger>
              <SelectContent>
                {agencias.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {agenciaSelecionada && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Matriz de Realocação</CardTitle>
                  <CardDescription>Edite os valores por gestor (colunas) e subsegmento (linhas)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border">Subsegmento</th>
                          {gestoresNaAgencia.map((g) => (
                            <th key={g.id} className="p-2 border text-left">
                              <div className="font-medium">{g.nome}</div>
                              <div className="text-xs text-muted-foreground">{g.associadosAtuais}</div>
                            </th>
                          ))}
                          <th className="p-2 border">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subsegmentosDaAgencia.map((s) => (
                          <tr key={s} className="odd:bg-muted/10">
                            <td className="p-2 border align-top">{s}</td>
                            {gestoresNaAgencia.map((g) => (
                              <td key={g.id + s} className="p-2 border">
                                <input
                                  type="number"
                                  min={0}
                                  className="w-20 p-1 border rounded"
                                  value={editedMatrix[g.id]?.[s] ?? 0}
                                  onChange={(e) => handleCellChange(g.id, s, Number(e.target.value || 0))}
                                />
                              </td>
                            ))}
                            <td className="p-2 border text-right font-medium">
                              {gestoresNaAgencia.reduce((sum, g) => sum + (editedMatrix[g.id]?.[s] ?? 0), 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="p-2 border font-medium">Total por Gestor</td>
                          {gestoresNaAgencia.map((g) => (
                            <td key={`total-${g.id}`} className="p-2 border text-right font-semibold">
                              {subsegmentosDaAgencia.reduce((sum, s) => sum + (editedMatrix[g.id]?.[s] ?? 0), 0)}
                            </td>
                          ))}
                          <td className="p-2 border text-right font-semibold">
                            {gestoresNaAgencia.reduce((t, g) => t + subsegmentosDaAgencia.reduce((s, sub) => s + (editedMatrix[g.id]?.[sub] ?? 0), 0), 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button onClick={aplicarAlteracoesDaMatriz} className="bg-gradient-sicredi">Aplicar Alterações</Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        // reset to originalCounts
                        const reset: Record<string, Record<string, number>> = {};
                        gestoresNaAgencia.forEach((g) => {
                          reset[g.id] = {};
                          subsegmentosDaAgencia.forEach((s) => {
                            reset[g.id][s] = originalCounts[g.id]?.[s] ?? 0;
                          });
                        });
                        setEditedMatrix(reset);
                      }}
                    >
                      Resetar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {gestorOrigem && gestorDestino && associadosSelecionados.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Previsão após Realocação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{gestorOrigem.nome}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {gestorOrigem.associadosAtuais}
                    </span>
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">{novaOcupacaoOrigem}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((novaOcupacaoOrigem / gestorOrigem.limiteIdeal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{gestorDestino.nome}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {gestorDestino.associadosAtuais}
                    </span>
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">{novaOcupacaoDestino}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((novaOcupacaoDestino / gestorDestino.limiteIdeal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleRealocar}
            disabled={associadosSelecionados.length === 0 || !gestorDestinoId}
            className="w-full bg-gradient-sicredi hover:opacity-90"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Realizar Realocação ({associadosSelecionados.length} associado
            {associadosSelecionados.length !== 1 ? "s" : ""})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
