import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ADVANCED_FIELDS, DEFAULT_SETTINGS, type AdvancedSettings } from "@/lib/agent-options";
import type { Agent } from "@/lib/agents";

export function AdvancedSettingsDialog({ open, onOpenChange, agent, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; agent: Agent; onSave: (s: AdvancedSettings) => void;
}) {
  const initial = { ...DEFAULT_SETTINGS, ...((agent.settings as Partial<AdvancedSettings>) ?? {}) };
  const [s, setS] = useState<AdvancedSettings>(initial);
  useEffect(() => { if (open) setS(initial); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Advanced settings</DialogTitle></DialogHeader>
        <div className="space-y-6 py-2">
          {ADVANCED_FIELDS.map((f) => (
            <div key={f.key} className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="tabular-nums text-muted-foreground">{Number(s[f.key].toFixed(2))}{f.unit}</span>
              </div>
              <Slider min={f.min} max={f.max} step={f.step} value={[s[f.key]]} onValueChange={([v]) => setS({ ...s, [f.key]: v })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setS(DEFAULT_SETTINGS)}>Reset to Default</Button>
          <Button onClick={() => { onSave(s); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
