import { useState } from 'react';
import { ChevronDown, Mail, Heart } from 'lucide-react';
import NavBar from '../components/NavBar';
import { typography } from '../styles/typography';

export default function About() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };
  return (
    <div className="flex flex-col h-full bg-cream dark:bg-gray-900">
      <NavBar />
      <div className="flex-1 bg-cream dark:bg-gray-900 px-36 py-36 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column - About & Features */}
            <div className="lg:col-span-5 space-y-6">
              <div className="text-center lg:text-left">
                
                <h1 className={`${typography.h1} mb-4`}>About Fetch Hub</h1>
                <p className={typography.bodyLarge}>
                  Fetch Hub is a collaborative visual feedback tool that makes it easy to review and annotate webpages with your team.

                </p>
              </div>

              <div className="space-y-4">
                <h2 className={`${typography.h3}`}>Features</h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className={`flex-shrink-0 font-bold ${typography.body}`}>•</span>
                    <p className={typography.body}>Visual area selection and annotation</p>
                  </div>
                  <div className="flex gap-3">
                    <span className={`flex-shrink-0 font-bold ${typography.body}`}>•</span>
                    <p className={typography.body}>Screenshot capture with comments</p>
                  </div>
                  <div className="flex gap-3">
                    <span className={`flex-shrink-0 font-bold ${typography.body}`}>•</span>
                    <p className={typography.body}>Team collaboration and feedback tracking</p>
                  </div>
                  <div className="flex gap-3">
                    <span className={`flex-shrink-0 font-bold ${typography.body}`}>•</span>
                    <p className={typography.body}>Review history organized by page and date</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Troubleshooting Card */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-stone-200 dark:border-gray-700 p-6">
                <h3 className={`${typography.h4} mb-4`}>
                  Troubleshooting
                </h3>
                
                <div className="space-y-4">
                  {[
                    {
                      title: "Extension not appearing in browser",
                      content: "Make sure you've installed the extension and pinned it to your toolbar. Go to chrome://extensions and ensure Fetch is enabled."
                    },
                    {
                      title: "Can't capture screenshots",
                      content: "Check that the extension has permission to access the current webpage. Some pages (like chrome:// URLs) block extensions for security reasons."
                    },
                    {
                      title: "Comments not saving",
                      content: "Ensure you're connected to the internet. Comments are saved to the cloud and require an active connection. Try clicking the submit button or pressing Enter to save."
                    },
                    {
                      title: "Screenshots not showing in dashboard",
                      content: "Refresh the page to load the latest screenshots. Make sure you clicked \"Save\" in the extension after adding your comments."
                    },
                    {
                      title: "Extension overlay won't close",
                      content: "Click the \"Exit\" button in the top-right corner or press ESC to close the review overlay. If it's stuck, refresh the page."
                    },
                    {
                      title: "Area selection not working",
                      content: "Make sure you're in review mode (click \"Start review\" in the extension popup). Click and drag to select areas on the page."
                    },
                    {
                      title: "Images not loading properly",
                      content: "Some websites have CORS restrictions that prevent image capture. Try viewing the screenshot in the extension popup or dashboard."
                    },
                    {
                      title: "Can't delete screenshots",
                      content: "Use the trash icon next to each screenshot to move it to the trash bin. Items in trash are permanently deleted after 30 days."
                    }
                  ].map((item, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex flex-col gap-2">
                      <button
                        onClick={() => toggleItem(index)}
                        className="w-full flex items-center justify-between py-2 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded"
                      >
                        <h4 className={typography.label}>{item.title}</h4>
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedItems.has(index) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedItems.has(index) && (
                        <div className="pb-2 px-2">
                          <p className={`${typography.bodySmall} text-gray-600 dark:text-gray-400`}>
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Information - Bottom of Page */}
          <div className="flex justify-center pt-32">
            <div className="inline-flex items-center gap-2">
              <span className={`${typography.bodySmall} text-gray-700 dark:text-gray-300 flex items-center gap-1`}>
                Made with <Heart className="w-3 h-3 text-black dark:text-white" /> by Leah Wang
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className={`${typography.bodySmall} text-gray-700 dark:text-gray-300`}>
                lwang@cloudflare.com
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
