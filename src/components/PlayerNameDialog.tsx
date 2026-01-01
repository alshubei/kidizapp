import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PlayerNameDialogProps {
  isOpen: boolean;
  onConfirm: (name: string) => void;
  onCancel?: () => void;
}

export const PlayerNameDialog: React.FC<PlayerNameDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length > 0) {
      onConfirm(trimmedName);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Neues Spiel 🎮</DialogTitle>
          <DialogDescription className="text-base">
            Wie heißt du? Wir speichern deinen Fortschritt, damit du später weitermachen kannst!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            type="text"
            placeholder="Dein Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg h-12"
            autoFocus
            maxLength={50}
          />
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="text-base"
              >
                Abbrechen
              </Button>
            )}
            <Button
              type="submit"
              disabled={name.trim().length === 0}
              className="text-base bg-btn-blue hover:bg-btn-blue/90"
            >
              Spielen! 🚀
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

