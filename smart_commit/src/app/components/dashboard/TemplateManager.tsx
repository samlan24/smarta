"use client";
import { useState, useEffect } from "react";
import { Copy, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    templateLimit: number;
  } | null>(null);

  const fetchTemplates = async () => {
  try {

    const response = await fetch("/api/users/templates");


    const data = await response.json();


    if (data.templates) {
      setTemplates(data.templates);

    }

    // Check if planInfo exists in response
    if (data.planInfo) {

      setPlanInfo({
        planName: data.planInfo.planName,
        templateLimit: data.planInfo.templateLimit,
      });
    } else {

    }

  } catch (error) {

    setError("Failed to load templates");
  }
};

  const createTemplate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });

      const data = await response.json();

      // Handle plan limit errors
      if (response.status === 402) {
        setError(
          `${data.error} ${
            data.upgrade_required
              ? "Upgrade to Pro for unlimited templates."
              : ""
          }`
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create template");
      }

      await fetchTemplates();
      setNewTemplate({ name: "", message: "" });
      setShowNewTemplate(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create template"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;

    try {
      // Use dashboard endpoint for consistency
      const response = await fetch(
        `/api/dashboard/templates/${encodeURIComponent(name)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      await fetchTemplates();
    } catch (error) {
      setError("Failed to delete template");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Commit Templates
          </h3>
          {planInfo && (
            <p className="text-sm text-gray-600">
              {templates.length}/
              {planInfo.templateLimit === -1 ? "∞" : planInfo.templateLimit}{" "}
              templates used
              {planInfo.planName && ` (${planInfo.planName} plan)`}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowNewTemplate(true)}
          disabled={
            !!planInfo &&
            planInfo.templateLimit !== -1 &&
            templates.length >= planInfo.templateLimit
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Template
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {showNewTemplate && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">
            Create New Template
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., api-fix, feature-add"
                maxLength={100}
                className="w-full text-gray-900 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commit Message
              </label>
              <textarea
                value={newTemplate.message}
                onChange={(e) =>
                  setNewTemplate((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder="fix: resolve API validation error"
                maxLength={100}
                rows={3}
                className="w-full p-2 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1">
                {newTemplate.message.length}/100 characters
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={createTemplate}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => {
                setShowNewTemplate(false);
                setNewTemplate({ name: "", message: "" });
                setError(null);
              }}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="border rounded-lg p-3 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {template.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(template.created_at).toLocaleDateString()}
                  </span>
                </div>
                <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded break-all">
                  {template.message}
                </code>
              </div>

              <div className="flex gap-1 ml-3">
                <button
                  onClick={() => copyToClipboard(template.message)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Copy message"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => deleteTemplate(template.name)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete template"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No templates saved yet</p>
            <p className="text-sm mt-1">
              Create templates for frequently used commit messages
            </p>
          </div>
        )}
      </div>

      {planInfo &&
        planInfo.templateLimit !== -1 &&
        templates.length >= planInfo.templateLimit && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
            Template limit reached ({templates.length}/{planInfo.templateLimit}
            ).
            {planInfo.planName === "Free" && (
              <span className="ml-1">
                <button className="underline text-orange-600 hover:text-orange-800">
                  Upgrade to Pro
                </button>{" "}
                for unlimited templates.
              </span>
            )}
          </div>
        )}
    </div>
  );
}
