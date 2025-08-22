import React, { useState } from "react";
import { fetchApi } from '../../utils/api';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/use-toast";

export default function UploadNumbersModal({ campaignId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { toast } = useToast();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("numbersFile", file);

    try {
      const data = await fetchApi(`/campaigns/${campaignId}/numbers`, {
        method: "POST",
        body: formData
      });

      setSuccess(`Successfully uploaded ${data.totalUploaded} numbers`);
      
      // Show toast notification
      toast({
        title: "Success",
        description: `Uploaded ${data.totalUploaded} numbers successfully`,
        variant: "default",
      });
      
      // Notify parent component about successful upload
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err.message || "Failed to upload numbers";
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upload Phone Numbers</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="numbersFile">Select TXT File *</Label>
            <Input
              type="file"
              id="numbersFile"
              name="numbersFile"
              accept=".txt"
              onChange={handleFileChange}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              File should contain one phone number per line. Max 1MB.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !file}
            >
              {isSubmitting ? "Uploading..." : "Upload Numbers"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}