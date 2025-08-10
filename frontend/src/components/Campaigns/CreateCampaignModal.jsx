import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from '../../utils/api';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import { DatePicker } from '../ui/DatePicker';
import { format } from "date-fns";

export default function CreateCampaignModal({ onClose }) {
  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_date: new Date(),
    message: "",
    campaign_type: "whatsapp",
    image_url: "",
    numbers_file: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [buttonType, setButtonType] = useState("none");
  const [buttonMessage, setButtonMessage] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image_url" && files && files[0]) {
      const file = files[0];
      setPreviewImage(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, numbers_file: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formPayload = new FormData();
      formPayload.append('campaign_name', formData.campaign_name);
      formPayload.append('campaign_date', format(formData.campaign_date, 'yyyy-MM-dd'));
      formPayload.append('message', formData.message);
      formPayload.append('campaign_type', formData.campaign_type);
      
      if (formData.image_url) {
        formPayload.append('image_url', formData.image_url);
      }
      
      if (formData.numbers_file) {
        formPayload.append('numbers_file', formData.numbers_file);
      }

      const data = await fetchApi('/campaigns', {
        method: "POST",
        body: formPayload
      });

      if (data.success) {
        onClose();
        navigate(`/campaigns/${data.campaign_id}/upload`);
      } else {
        throw new Error(data.message || "Failed to create campaign");
      }
    } catch (err) {
      console.error("Create campaign error:", err);
      setError(err.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl flex">
        {/* Form Section */}
        <div className="w-1/2 pr-6">
          <h2 className="text-xl font-bold mb-4">Create WhatsApp Campaign</h2>
          
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="campaign_name">Campaign Name *</Label>
              <Input
                id="campaign_name"
                name="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                placeholder="e.g. BLACK FRIDAY"
                required
              />
            </div>

            <div>
              <Label>Channel</Label>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="font-medium">WhatsApp</span>
              </div>
            </div>

            <div>
              <Label htmlFor="campaign_date">Campaign Date *</Label>
<DatePicker
  selected={formData.campaign_date}
  onSelect={(date) => setFormData({...formData, campaign_date: date})}
/>
            </div>

            <div>
              <Label>Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {previewImage ? (
                  <div className="mb-2">
                    <img src={previewImage} alt="Preview" className="max-h-40 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">{formData.image_url?.name}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Drag & drop image here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PNG/JPG/JPEG, max 5MB</p>
                  </div>
                )}
                <Input
                  type="file"
                  id="image_url"
                  name="image_url"
                  onChange={handleChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <Label htmlFor="image_url" className="mt-2 inline-block px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
                  Select Image
                </Label>
              </div>
            </div>

            <div>
              <Label>Campaign Numbers</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {formData.numbers_file ? (
                  <p className="text-sm text-gray-500">{formData.numbers_file.name}</p>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Drag & drop TXT file here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">TXT file, max 1MB</p>
                  </div>
                )}
                <Input
                  type="file"
                  id="numbers_file"
                  name="numbers_file"
                  onChange={handleFileChange}
                  accept=".txt"
                  className="hidden"
                />
                <Label htmlFor="numbers_file" className="mt-2 inline-block px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
                  Select File
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter your message content"
                required
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Button Options</Label>
              <div className="space-y-2">
                <Select value={buttonType} onValueChange={setButtonType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select button type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="one">One Button</SelectItem>
                    <SelectItem value="two">Two Buttons</SelectItem>
                    <SelectItem value="three">Three Buttons</SelectItem>
                    <SelectItem value="list">List Buttons</SelectItem>
                  </SelectContent>
                </Select>

                {buttonType !== "none" && (
                  <>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Button type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cta">Call to action</SelectItem>
                        <SelectItem value="quick_reply">Quick reply</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="CTA type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="contact">Contact Us</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Button message"
                      value={buttonMessage}
                      onChange={(e) => setButtonMessage(e.target.value)}
                    />

                    <Input
                      placeholder="Link URL"
                      value={buttonLink}
                      onChange={(e) => setButtonLink(e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </form>
        </div>

        {/* Mobile Preview Section */}
        <div className="w-1/2 pl-6 border-l">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold mb-4">Mobile Preview</h3>
            
            <div className="bg-white rounded-lg shadow-md p-4 max-w-xs mx-auto">
              {/* WhatsApp Header */}
              <div className="bg-green-600 text-white p-3 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Buckleton Name</p>
                    <p className="text-xs">Today</p>
                  </div>
                </div>
                <span className="text-xs">23:09</span>
              </div>

              {/* Message Content */}
              <div className="p-4">
                {previewImage && (
                  <img 
                    src={previewImage} 
                    alt="Campaign" 
                    className="w-full rounded-lg mb-3"
                  />
                )}
                
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="font-medium mb-1">{formData.campaign_name || "Campaign Name"}</p>
                  <p className="text-sm">{formData.message || "Your message content will appear here"}</p>
                </div>

                {buttonType !== "none" && (
                  <div className="mt-3 space-y-2">
                    {buttonMessage && (
                      <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm">
                        {buttonMessage}
                      </button>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  This is a message sent by the business. You can customize it with a ton of features!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}