// ConfirmCampaignModal.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";

export default function ConfirmCampaignModal({ onConfirm, onCancel }) {
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Campaign Creation</DialogTitle>
          <DialogDescription>
            Are you sure you want to create this campaign? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Yes, Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
