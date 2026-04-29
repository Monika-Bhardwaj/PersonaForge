const { useState, useEffect, useRef } = React;

const personas = {
    Anshuman: {
        id: "Anshuman",
        name: "Anshuman Singh",
        role: "Co-founder",
        avatar: "https://ui-avatars.com/api/?name=Anshuman+Singh&background=0D8ABC&color=fff&bold=true",
        greeting: "Good to have you here. What's on your mind?",
        chips: [
            { title: "Practice coding", desc: "How to stay consistent daily" },
            { title: "Data structures", desc: "Explain a complex concept" },
            { title: "Career advice", desc: "Startups vs Corporate" },
            { title: "Future of AI", desc: "Will it replace engineers?" }
        ]
    },
    Abhimanyu: {
        id: "Abhimanyu",
        name: "Abhimanyu Saxena",
        role: "Co-founder",
        avatar: "https://ui-avatars.com/api/?name=Abhimanyu+Saxena&background=ff5c00&color=fff&bold=true",
        greeting: "Yo! What are you building? LFG 🚀",
        chips: [
            { title: "Start a project", desc: "How do I build something real?" },
            { title: "AI & Agents", desc: "Where is the frontier?" },
            { title: "Story time", desc: "How did InterviewBit start?" },
            { title: "Feeling late", desc: "Is it too late for AI?" }
        ]
    },
    Kshitij: {
        id: "Kshitij",
        name: "Kshitij Mishra",
        role: "Lead Instructor",
        avatar: "https://ui-avatars.com/api/?name=Kshitij+Mishra&background=10B981&color=fff&bold=true",
        greeting: "What are you working on?",
        chips: [
            { title: "Founder Mode", desc: "What does it actually mean?" },
            { title: "Struggling", desc: "I don't get recursion." },
            { title: "Open Source", desc: "Is it just free labour?" },
            { title: "Product Mindset", desc: "How to think like a PM" }
        ]
    }
};

const SendIcon = ({ disabled }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={disabled ? "text-gray-500" : "text-black"}>
        <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
);

const ChevronDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

function App() {
    const [activePersona, setActivePersona] = useState("Anshuman");
    const [chatHistory, setChatHistory] = useState({
        Anshuman: [],
        Abhimanyu: [],
        Kshitij: []
    });
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const chatEndRef = useRef(null);
    const dropdownRef = useRef(null);

    const activeData = personas[activePersona];
    const messages = chatHistory[activePersona];

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSend = async (text) => {
        if (!text.trim()) return;
        
        const newMsg = { role: "user", content: text };
        const updatedMessages = [...messages, newMsg];
        
        setChatHistory(prev => ({ ...prev, [activePersona]: updatedMessages }));
        setInputValue("");
        setIsTyping(true);
        setErrorMsg("");

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    persona: activePersona,
                    messages: updatedMessages
                })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error("You're sending messages too fast. Please try again in a moment.");
                }
                throw new Error("Something went wrong. Please try again.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let assistantResponse = "";

            setChatHistory(prev => ({
                ...prev,
                [activePersona]: [...updatedMessages, { role: "assistant", content: "" }]
            }));
            
            setIsTyping(false);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6);
                        if (dataStr.trim() === "[DONE]") break;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.error) {
                                setErrorMsg(data.error);
                            } else if (data.content) {
                                assistantResponse += data.content;
                                setChatHistory(prev => {
                                    const curr = prev[activePersona];
                                    const newHistory = [...curr];
                                    newHistory[newHistory.length - 1].content = assistantResponse;
                                    return { ...prev, [activePersona]: newHistory };
                                });
                            }
                        } catch (e) {
                            console.error("Error parsing JSON:", e, dataStr);
                        }
                    }
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            setErrorMsg(error.message === "Failed to fetch" ? "Connection error. Please check your network and ensure the backend is running." : error.message);
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full text-gray-100 font-sans">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 glass-header">
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-lg font-display font-semibold tracking-wide"
                    >
                        PersonaForge <span className="text-gray-400 font-normal">v2</span>
                        <ChevronDown />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 glass-panel rounded-xl shadow-2xl py-2 z-50 animate-dropdown">
                            <div className="px-3 pb-2 mb-2 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Select Persona
                            </div>
                            {Object.values(personas).map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => {
                                        setActivePersona(p.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <div className="font-medium text-[#ececec]">{p.name}</div>
                                            <div className="text-sm text-gray-400">{p.role}</div>
                                        </div>
                                    </div>
                                    {activePersona === p.id && <CheckIcon />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
                <div className="bg-red-900/50 text-red-200 px-4 py-3 text-sm flex justify-center border-b border-red-900">
                    {errorMsg}
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 animate-fade-in-up">
                        <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center mb-6 shadow-2xl p-1">
                            <img src={activeData.avatar} alt="Logo" className="w-full h-full rounded-full" />
                        </div>
                        <h1 className="text-4xl font-display font-semibold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">How can I help you today?</h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                            {activeData.chips.map((chip, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSend(chip.desc)}
                                    className="flex flex-col text-left p-5 rounded-2xl glass-panel hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] group"
                                >
                                    <span className="font-medium text-white mb-1">{chip.title}</span>
                                    <span className="text-gray-400 text-sm group-hover:text-gray-200 transition-colors">{chip.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col max-w-3xl mx-auto px-4 py-6 gap-6">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={"flex w-full animate-fade-in-up " + (msg.role === 'user' ? "justify-end" : "justify-start")}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full flex-shrink-0 mr-4 overflow-hidden shadow-lg border border-white/10">
                                        <img src={activeData.avatar} alt={activeData.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                
                                <div className={msg.role === 'user' ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg rounded-2xl px-5 py-3 max-w-[80%]" : "text-gray-200 w-full pt-1 max-w-[calc(100%-3rem)] markdown-body"}>
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    ) : (
                                        <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex w-full animate-fade-in-up justify-start">
                                <div className="w-8 h-8 rounded-full flex-shrink-0 mr-4 overflow-hidden shadow-lg border border-white/10">
                                    <img src={activeData.avatar} alt={activeData.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="pt-2 text-gray-200">
                                    <span className="cursor-blink"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} className="h-4"></div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="w-full pt-2 pb-6 px-4">
                <div className="max-w-3xl mx-auto relative">
                    <div className="relative flex items-end glass-input-container rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 transition-all duration-300">
                        <textarea
                            id="chat-input"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(inputValue);
                                    e.target.style.height = 'auto';
                                }
                            }}
                            placeholder="Message PersonaForge..."
                            className="w-full max-h-[200px] bg-transparent py-4 pl-5 pr-14 focus:outline-none text-white placeholder-gray-400 resize-none overflow-y-auto min-h-[56px]"
                            disabled={isTyping}
                            rows="1"
                        />
                        <button 
                            onClick={() => {
                                handleSend(inputValue);
                                document.getElementById('chat-input').style.height = 'auto';
                            }}
                            disabled={!inputValue.trim() || isTyping}
                            className={"absolute bottom-2 right-2 p-2 rounded-full transition-colors flex items-center justify-center " + (inputValue.trim() && !isTyping ? "bg-white hover:bg-gray-200 text-black" : "bg-white/10 text-gray-500 cursor-not-allowed")}
                            aria-label="Send message"
                        >
                            <SendIcon disabled={!inputValue.trim() || isTyping} />
                        </button>
                    </div>
                    <div className="text-center mt-3 text-xs text-gray-400">
                        PersonaForge can make mistakes. Consider verifying important information.
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
