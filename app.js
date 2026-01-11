const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3030;

// Setup Handlebars
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    helpers: {
        json: function(context) {
            return JSON.stringify(context);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Create necessary directories
const dirs = ['views/layouts', 'views/partials', 'public', 'config', 'blogs', 'temp'];
dirs.forEach(dir => {
    fs.ensureDirSync(path.join(__dirname, dir));
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const tempDir = path.join(__dirname, 'temp');
        fs.ensureDirSync(tempDir);
        cb(null, tempDir);
    },
    filename: function(req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP, SVG)!'));
        }
    }
});

// Middleware - ADD CSP headers that allow inline scripts
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data: blob:;"
    );
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'temp')));

// Configuration file path
const configPath = path.join(__dirname, 'config', 'settings.json');

// Helper function to get config
function getConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading config:', error);
    }
    return {
        deepseekApiKey: '',
        imageAiApiKey: '',
        hugoPath: '',
        frontMatter: {
            title: '',
            date: '',
            draft: false,
            description: '',
            noindex: false,
            featured: false,
            pinned: false,
            comments: true,
            series: [],
            categories: [],
            tags: [],
            images: [],
            alt_text: ''
        },
        sftp: {
            host: '',
            port: 22,
            username: '',
            password: '',
            remotePath: ''
        },
        theme: 'light'
    };
}

// Helper function to save config
function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

// Routes
app.get('/', (req, res) => {
    const config = getConfig();
    res.render('index', {
        title: 'Blog Creator Pro',
        config: config,
        blogTypes: [
            { value: 'instructional', label: 'Instructional', icon: 'fas fa-graduation-cap' },
            { value: 'personable', label: 'Personal', icon: 'fas fa-user-circle' },
            { value: 'story', label: 'Story', icon: 'fas fa-book' },
            { value: 'informative', label: 'Informative', icon: 'fas fa-chart-bar' },
            { value: 'persuasive', label: 'Persuasive', icon: 'fas fa-bullhorn' }
        ],
        voices: [
            { value: 'inspirational', label: 'Inspirational', icon: 'fas fa-star' },
            { value: 'serious', label: 'Serious', icon: 'fas fa-balance-scale' },
            { value: 'casual', label: 'Casual', icon: 'fas fa-coffee' },
            { value: 'humorous', label: 'Humorous', icon: 'fas fa-laugh' },
            { value: 'empathetic', label: 'Empathetic', icon: 'fas fa-heart' }
        ]
    });
});

app.get('/settings', (req, res) => {
    const config = getConfig();
    res.render('settings', {
        title: 'Settings',
        config: config,
        success: req.query.success === 'true',
        error: req.query.error === 'true'
    });
});

app.post('/settings', (req, res) => {
    try {
        const config = getConfig();
        
        // Update config with form data
        config.deepseekApiKey = req.body.deepseekApiKey || '';
        config.imageAiApiKey = req.body.imageAiApiKey || '';
        config.hugoPath = req.body.hugoPath || '';
        config.theme = req.body.theme || 'light';
        
        // Front matter with all new fields
        config.frontMatter = {
            title: '',
            date: '',
            draft: req.body.draft === 'true',
            description: '',
            noindex: req.body.noindex === 'true',
            featured: req.body.featured === 'true',
            pinned: req.body.pinned === 'true',
            comments: req.body.comments !== 'false', // defaults to true
            series: [],
            categories: (req.body.categories || '').split(',').map(cat => cat.trim()).filter(cat => cat),
            tags: (req.body.tags || '').split(',').map(tag => tag.trim()).filter(tag => tag),
            images: [],
            alt_text: ''
        };
        
        // SFTP settings
        config.sftp = {
            host: req.body.host || '',
            port: req.body.port || 22,
            username: req.body.username || '',
            password: req.body.password || '',
            remotePath: req.body.remotePath || ''
        };
        
        if (saveConfig(config)) {
            res.redirect('/settings?success=true');
        } else {
            res.redirect('/settings?error=true');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        res.redirect('/settings?error=true');
    }
});

// Generate blog content using DeepSeek API
async function generateWithDeepSeek(prompt, apiKey) {
    try {
        console.log('Sending request to DeepSeek API...');
        console.log('Prompt length:', prompt.length);
        
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a professional blog writer. Write engaging, human-like blog content with natural flow and varied sentence structures. Respond with well-formatted markdown including headings, paragraphs, and lists where appropriate.'
                    },
                    { 
                        role: 'user', 
                        content: prompt 
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        
        console.log('DeepSeek API Response received');
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('DeepSeek API Error Details:');
        console.error('- Status:', error.response?.status);
        console.error('- Message:', error.response?.data?.error?.message || error.message);
        
        if (error.code === 'ECONNABORTED') {
            throw new Error('DeepSeek API request timed out. Please try again.');
        } else if (error.response?.status === 401) {
            throw new Error('Invalid DeepSeek API key. Please check your API key in Settings.');
        } else if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.response?.data?.error?.message) {
            throw new Error(`DeepSeek API Error: ${error.response.data.error.message}`);
        } else {
            throw new Error(`DeepSeek API Error: ${error.message}`);
        }
    }
}

// Generate SEO-optimized titles using DeepSeek API
async function generateSEOTitles(topic, apiKey) {
    try {
        console.log('Generating SEO titles for:', topic);
        
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an SEO expert and content strategist. Generate 5 highly clickable, SEO-optimized blog post titles. Each title should be unique, compelling, and include relevant keywords. Make them engaging and appropriate for the topic.'
                    },
                    { 
                        role: 'user', 
                        content: `Generate 5 SEO-optimized blog post titles about: "${topic}". Return ONLY the 5 titles, each on a new line, no numbering or bullet points.`
                    }
                ],
                max_tokens: 200,
                temperature: 0.8,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('SEO Titles generated');
        const titles = response.data.choices[0].message.content
            .split('\n')
            .map(title => title.trim())
            .filter(title => title.length > 0)
            .slice(0, 5); // Take only first 5 titles
        
        return titles;
    } catch (error) {
        console.error('SEO Titles API Error:', error.message);
        throw new Error(`SEO titles generation failed: ${error.message}`);
    }
}

// Format content as a blog using DeepSeek API
async function formatAsBlog(content, blogType, voice, apiKey) {
    try {
        console.log('Formatting content as blog...');
        
        const prompts = {
            instructional: 'Format this content as an instructional blog post. Add appropriate headings, structure it with clear sections, and make it engaging for readers who want to learn.',
            personable: 'Format this content as a personal blog post. Add a conversational tone, appropriate headings, and structure it to tell a compelling story or share experiences.',
            story: 'Format this content as a narrative blog post. Add storytelling elements, appropriate headings, and structure it to create an engaging narrative flow.',
            informative: 'Format this content as an informative blog post. Add clear headings, organize information logically, and make it educational and engaging.',
            persuasive: 'Format this content as a persuasive blog post. Add compelling headings, structure arguments effectively, and make it convincing and engaging.'
        };
        
        const voices = {
            inspirational: 'Use an inspirational and motivational tone.',
            serious: 'Use a serious, professional, and authoritative tone.',
            casual: 'Use a casual, friendly, and relaxed tone.',
            humorous: 'Use a humorous and witty tone.',
            empathetic: 'Use an empathetic, understanding, and compassionate tone.'
        };
        
        const formatPrompt = prompts[blogType] || prompts.informative;
        const voicePrompt = voices[voice] || voices.casual;
        
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a professional blog editor. Format the provided content as a well-structured blog post with appropriate markdown formatting, headings, and organization. Do NOT change the core meaning or add new information. Only format and improve structure.'
                    },
                    { 
                        role: 'user', 
                        content: `${formatPrompt} ${voicePrompt}\n\nFormat this content:\n\n${content}`
                    }
                ],
                max_tokens: 2500,
                temperature: 0.5,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 60000
            }
        );
        
        console.log('Content formatted as blog');
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Formatting API Error:', error.message);
        throw new Error(`Blog formatting failed: ${error.message}`);
    }
}

// Spell and grammar correction using DeepSeek API
async function correctSpellingGrammar(text, apiKey) {
    try {
        console.log('Correcting spelling and grammar...');
        
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a professional editor. Correct ONLY spelling and grammar errors in the provided text. Do NOT rewrite or change the meaning. Do NOT add new content. Do NOT change the style or tone. Only fix spelling mistakes and grammar errors. Return the corrected text exactly as provided, with only the necessary corrections.'
                    },
                    { 
                        role: 'user', 
                        content: `Please correct ONLY spelling and grammar errors in this text. Do not change anything else:\n\n${text}`
                    }
                ],
                max_tokens: Math.min(text.length * 2, 4000),
                temperature: 0.3,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 60000
            }
        );
        
        console.log('Spell/grammar correction complete');
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Correction API Error:', error.message);
        throw new Error(`Spell/grammar correction failed: ${error.message}`);
    }
}

// Create blog prompt based on selections
function createBlogPrompt(topic, blogType, voice, additionalInstructions) {
    const prompts = {
        instructional: `Write a detailed instructional blog post about "${topic}". Provide step-by-step guidance, practical tips, and actionable advice. Use clear headings and bullet points where appropriate. Aim for about 800-1000 words.`,
        personable: `Write a personal and engaging blog post about "${topic}". Share personal experiences, anecdotes, and insights in a conversational tone. Make it relatable and authentic. Aim for about 800-1000 words.`,
        story: `Write a compelling narrative blog post about "${topic}". Create a story that captivates readers with characters, plot, and emotional depth. Use descriptive language. Aim for about 800-1000 words.`,
        informative: `Write an informative and well-researched blog post about "${topic}". Provide facts, data, and analysis while keeping it accessible and engaging. Aim for about 800-1000 words.`,
        persuasive: `Write a persuasive blog post about "${topic}". Use compelling arguments, evidence, and rhetorical strategies to convince readers. Aim for about 800-1000 words.`
    };
    
    const voices = {
        inspirational: 'Use an inspirational and motivational tone that uplifts and encourages readers.',
        serious: 'Use a serious, professional, and authoritative tone suitable for expert audiences.',
        casual: 'Use a casual, friendly, and relaxed tone as if talking to a friend.',
        humorous: 'Use a humorous and witty tone with appropriate jokes and lighthearted observations.',
        empathetic: 'Use an empathetic, understanding, and compassionate tone that connects emotionally.'
    };
    
    const basePrompt = prompts[blogType] || prompts.informative;
    const voicePrompt = voices[voice] || voices.casual;
    
    let prompt = `${basePrompt} ${voicePrompt}.`;
    
    if (additionalInstructions && additionalInstructions.trim()) {
        prompt += ` Additional instructions: ${additionalInstructions}`;
    }
    
    prompt += ` Make the content sound human, avoid repetitive structures, and ensure uniqueness. Include markdown formatting with headings, lists, and emphasis where appropriate.`;
    
    return prompt;
}

// Generate slug from title
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

// Generate short slug from first 4 words of title
function generateShortSlug(text) {
    const words = text.trim().split(/\s+/).slice(0, 4).join(' ');
    return words
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

// Sanitize string for Hugo front matter (remove colons which break YAML)
function sanitizeForFrontMatter(text) {
    if (!text) return '';
    return text.replace(/:/g, ' -').trim();
}

// Extract front matter from markdown
function extractFrontMatter(markdown) {
    const frontMatter = {};
    const lines = markdown.split('\n');
    
    if (lines[0] === '---') {
        let i = 1;
        while (i < lines.length && lines[i] !== '---') {
            const line = lines[i];
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Handle array values
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = JSON.parse(value);
                } else if (value === 'true' || value === 'false') {
                    value = value === 'true';
                }
                
                frontMatter[key] = value;
            }
            i++;
        }
    }
    
    return frontMatter;
}

// Create markdown content with front matter
function createMarkdown(frontMatter, content) {
    let markdown = '---\n';
    // Write each field in the required order and format
    markdown += `title: ${frontMatter.title || ''}\n`;
    markdown += `date: ${frontMatter.date || ''}\n`;
    markdown += `draft: ${frontMatter.draft === true ? 'true' : 'false'}\n`;
    markdown += `description: ${frontMatter.description || ''}\n`;
    markdown += `noindex: ${frontMatter.noindex === true ? 'true' : 'false'}\n`;
    markdown += `featured: ${frontMatter.featured === true ? 'true' : 'false'}\n`;
    markdown += `pinned: ${frontMatter.pinned === true ? 'true' : 'false'}\n`;
    markdown += `comments: ${frontMatter.comments === false ? 'false' : 'true'}\n`;
    markdown += `series:\n`;
    if (Array.isArray(frontMatter.series) && frontMatter.series.length > 0) {
        frontMatter.series.forEach(item => {
            markdown += `  - ${item}\n`;
        });
    } else {
        markdown += `#  - \n`;
    }
    markdown += `categories:\n`;
    if (Array.isArray(frontMatter.categories) && frontMatter.categories.length > 0) {
        frontMatter.categories.forEach(item => {
            markdown += ` - ${item}\n`;
        });
    } else {
        markdown += ` - \n`;
    }
    markdown += `tags:\n`;
    if (Array.isArray(frontMatter.tags) && frontMatter.tags.length > 0) {
        frontMatter.tags.forEach(item => {
            markdown += `- ${item}\n`;
        });
    } else {
        markdown += `- \n`;
    }
    markdown += `\n`;
    markdown += `images:\n`;
    if (Array.isArray(frontMatter.images) && frontMatter.images.length > 0) {
        frontMatter.images.forEach(item => {
            markdown += `   - ${item}\n`;
        });
    } else {
        markdown += `   - \n`;
    }
    markdown += `alt_text: ${frontMatter.alt_text || ''}\n`;
    markdown += `\n---\n\n`;
    markdown += content;
    return markdown;
}

// Save blog from corrected content
function saveCorrectedBlog(title, description, content, config) {
    try {
        // Create blog structure
        const blogId = generateSlug(title) + '-' + Date.now();
        const blogDir = path.join(__dirname, 'blogs', blogId);
        fs.ensureDirSync(blogDir);
        
        // Create front matter - sanitize title and description to remove colons
        const frontMatter = {
            ...config.frontMatter,
            title: sanitizeForFrontMatter(title),
            description: sanitizeForFrontMatter(description || ''),
            date: new Date().toISOString(),
            draft: false
        };
        
        // Create markdown content
        const markdownContent = createMarkdown(frontMatter, content);
        
        // Save blog
        const blogPath = path.join(blogDir, 'index.md');
        fs.writeFileSync(blogPath, markdownContent);
        
        // If Hugo path is set, copy to Hugo content directory
        if (config.hugoPath && config.hugoPath.trim() && fs.existsSync(config.hugoPath)) {
            const hugoContentPath = path.join(config.hugoPath, 'content', 'posts', blogId);
            fs.ensureDirSync(hugoContentPath);
            
            // Copy all files from blog directory to Hugo directory
            fs.copySync(blogDir, hugoContentPath);
            console.log('Blog copied to Hugo content directory:', hugoContentPath);
        }
        
        return {
            success: true,
            blogId: blogId,
            path: blogPath,
            content: markdownContent
        };
        
    } catch (error) {
        console.error('Error saving corrected blog:', error);
        return {
            success: false,
            message: `Failed to save blog: ${error.message}`
        };
    }
}

// API test endpoint
app.post('/api/test', async (req, res) => {
    const config = getConfig();
    
    const results = {
        deepseek: { success: false, message: '' },
        hugo: { success: false, message: '' }
    };
    
    try {
        // Test DeepSeek API
        if (config.deepseekApiKey && config.deepseekApiKey.trim()) {
            const response = await axios.post(
                'https://api.deepseek.com/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }],
                    max_tokens: 10,
                    temperature: 0.1
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.deepseekApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );
            results.deepseek = { 
                success: true, 
                message: 'DeepSeek API connected successfully' 
            };
        } else {
            results.deepseek = { 
                success: false, 
                message: 'DeepSeek API key not configured' 
            };
        }
        
        // Test Hugo path
        if (config.hugoPath && config.hugoPath.trim()) {
            if (fs.existsSync(config.hugoPath)) {
                // Check if it looks like a Hugo directory
                const hasConfig = fs.existsSync(path.join(config.hugoPath, 'config.toml')) || 
                                 fs.existsSync(path.join(config.hugoPath, 'config.yaml')) ||
                                 fs.existsSync(path.join(config.hugoPath, 'config.yml'));
                
                if (hasConfig) {
                    results.hugo = { 
                        success: true, 
                        message: 'Hugo project found and looks valid' 
                    };
                } else {
                    results.hugo = { 
                        success: false, 
                        message: 'Directory exists but does not appear to be a Hugo project (no config file found)' 
                    };
                }
            } else {
                results.hugo = { 
                    success: false, 
                    message: 'Hugo path does not exist' 
                };
            }
        } else {
            results.hugo = { 
                success: false, 
                message: 'Hugo path not configured' 
            };
        }
        
        const allSuccess = results.deepseek.success && results.hugo.success;
        const message = allSuccess 
            ? 'All tests passed!' 
            : `Test results: ${results.deepseek.message}, ${results.hugo.message}`;
            
        res.json({ 
            success: allSuccess, 
            message: message,
            results: results
        });
        
    } catch (error) {
        console.error('Test error:', error.message);
        
        let errorMessage = `Test failed: ${error.message}`;
        if (error.response?.status === 401) {
            errorMessage = 'Invalid DeepSeek API key. Please check your API key in Settings.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Connection timeout. Please check your internet connection.';
        }
        
        res.json({ 
            success: false, 
            message: errorMessage,
            results: results
        });
    }
});

// Start Hugo server endpoint
app.post('/api/start-hugo-server', async (req, res) => {
    const config = getConfig();
    const { spawn, exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    try {
        if (!config.hugoPath || !config.hugoPath.trim()) {
            return res.json({
                success: false,
                message: 'Hugo path not configured. Please set the Hugo project path in Settings.'
            });
        }
        
        // Find Hugo project root (look for config.toml/config.yaml)
        let hugoRoot = config.hugoPath;
        
        // If the path ends with content/blog or similar, go up to find the root
        if (hugoRoot.includes('/content/')) {
            hugoRoot = hugoRoot.split('/content/')[0];
        }
        
        if (!fs.existsSync(hugoRoot)) {
            return res.json({
                success: false,
                message: `Hugo path does not exist: ${hugoRoot}`
            });
        }
        
        // Verify it's a Hugo project by checking for config file
        const hasConfig = fs.existsSync(path.join(hugoRoot, 'config.toml')) || 
                         fs.existsSync(path.join(hugoRoot, 'config.yaml')) ||
                         fs.existsSync(path.join(hugoRoot, 'config.yml')) ||
                         fs.existsSync(path.join(hugoRoot, 'hugo.toml')) ||
                         fs.existsSync(path.join(hugoRoot, 'config')) ||
                         fs.existsSync(path.join(hugoRoot, 'hugo.yaml'));
        
        if (!hasConfig) {
            return res.json({
                success: false,
                message: `Not a valid Hugo project (no config file found): ${hugoRoot}`
            });
        }
        
        // Check if Hugo is installed
        try {
            await execPromise('hugo version');
        } catch (error) {
            return res.json({
                success: false,
                message: 'Hugo is not installed or not in PATH. Please install Hugo first.'
            });
        }
        
        // Check if Hugo server is already running
        try {
            const { stdout } = await execPromise('lsof -i:1313 -t');
            if (stdout.trim()) {
                return res.json({
                    success: true,
                    message: 'Hugo server is already running on port 1313!',
                    url: 'http://localhost:1313'
                });
            }
        } catch (error) {
            // Port is free, continue
        }
        
        // Start Hugo server
        console.log('Starting Hugo server in:', hugoRoot);
        const hugoServer = spawn('hugo', ['server', '-D'], {
            cwd: hugoRoot,
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // Capture initial output to detect errors
        let output = '';
        let errorOutput = '';
        
        hugoServer.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log('Hugo server:', text.trim());
        });
        
        hugoServer.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            console.error('Hugo error:', text.trim());
        });
        
        hugoServer.on('error', (error) => {
            console.error('Failed to start Hugo server:', error);
        });
        
        // Wait for server to start
        setTimeout(() => {
            if (errorOutput.includes('Error') || errorOutput.includes('fatal')) {
                res.json({
                    success: false,
                    message: `Hugo server failed to start: ${errorOutput.substring(0, 200)}`
                });
            } else {
                // Unref after confirming it started
                hugoServer.unref();
                
                res.json({
                    success: true,
                    message: 'Hugo server started on port 1313! Opening in browser...',
                    url: 'http://localhost:1313'
                });
            }
        }, 1500);
        
    } catch (error) {
        console.error('Hugo server start error:', error);
        res.json({
            success: false,
            message: `Failed to start Hugo server: ${error.message}`
        });
    }
});

// Upload image endpoint
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ 
                success: false, 
                message: 'No image file uploaded' 
            });
        }
        
        console.log('Image uploaded:', req.file.filename);
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
        
    } catch (error) {
        console.error('Image upload error:', error);
        res.json({ 
            success: false, 
            message: `Image upload failed: ${error.message}` 
        });
    }
});

// Generate SEO titles endpoint
app.post('/api/generate-seo-titles', async (req, res) => {
    const { topic } = req.body;
    const config = getConfig();
    
    if (!config.deepseekApiKey || !config.deepseekApiKey.trim()) {
        return res.json({ 
            success: false, 
            message: 'DeepSeek API key not configured. Please go to Settings and add your API key.' 
        });
    }
    
    if (!topic || !topic.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please provide a topic for title generation' 
        });
    }
    
    try {
        const titles = await generateSEOTitles(topic, config.deepseekApiKey);
        
        res.json({
            success: true,
            message: 'SEO titles generated successfully',
            titles: titles
        });
        
    } catch (error) {
        console.error('SEO titles error:', error.message);
        res.json({ 
            success: false, 
            message: `SEO titles generation failed: ${error.message}` 
        });
    }
});

// Format content as blog endpoint
app.post('/api/format-blog', async (req, res) => {
    const { content, blogType, voice } = req.body;
    const config = getConfig();
    
    if (!config.deepseekApiKey || !config.deepseekApiKey.trim()) {
        return res.json({ 
            success: false, 
            message: 'DeepSeek API key not configured. Please go to Settings and add your API key.' 
        });
    }
    
    if (!content || !content.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please provide content to format' 
        });
    }
    
    try {
        const formattedContent = await formatAsBlog(content, blogType, voice, config.deepseekApiKey);
        
        res.json({
            success: true,
            message: 'Content formatted as blog successfully',
            formattedContent: formattedContent
        });
        
    } catch (error) {
        console.error('Format blog error:', error.message);
        res.json({ 
            success: false, 
            message: `Blog formatting failed: ${error.message}` 
        });
    }
});

// Spell and grammar correction endpoint
app.post('/api/correct-text', async (req, res) => {
    const { text } = req.body;
    const config = getConfig();
    
    if (!config.deepseekApiKey || !config.deepseekApiKey.trim()) {
        return res.json({ 
            success: false, 
            message: 'DeepSeek API key not configured. Please go to Settings and add your API key.' 
        });
    }
    
    if (!text || !text.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please provide text to correct' 
        });
    }
    
    try {
        const correctedText = await correctSpellingGrammar(text, config.deepseekApiKey);
        
        res.json({
            success: true,
            message: 'Text corrected successfully',
            original: text,
            corrected: correctedText
        });
        
    } catch (error) {
        console.error('Correction error:', error.message);
        res.json({ 
            success: false, 
            message: `Correction failed: ${error.message}` 
        });
    }
});

// NEW: Generate blog from corrected text endpoint
app.post('/api/generate-blog-from-corrected', async (req, res) => {
    const { title, description, content, blogType, voice, imageFilename } = req.body;
    const config = getConfig();
    
    if (!title || !title.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please provide a title for the blog' 
        });
    }
    
    if (!content || !content.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please provide content for the blog' 
        });
    }
    
    try {
        // Format content as blog if blogType and voice are provided
        let formattedContent = content;
        if (blogType && voice && config.deepseekApiKey) {
            formattedContent = await formatAsBlog(content, blogType, voice, config.deepseekApiKey);
        }
        
        // Save the blog
        const result = saveCorrectedBlog(title, description, formattedContent, config);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Blog saved successfully!',
                blogId: result.blogId,
                path: result.path,
                content: result.content,
                formattedContent: formattedContent
            });
        } else {
            res.json({
                success: false,
                message: result.message
            });
        }
        
    } catch (error) {
        console.error('Generate blog from corrected error:', error.message);
        res.json({ 
            success: false, 
            message: `Failed to save blog: ${error.message}` 
        });
    }
});

// Save corrected blog endpoint
app.post('/api/save-corrected-blog', async (req, res) => {
    const { title, description, content, imageFilename } = req.body;
    const config = getConfig();
    
    if (!title || !title.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please provide a title for the blog' 
        });
    }
    
    if (!content || !content.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please provide content for the blog' 
        });
    }
    
    try {
        // Handle image if provided
        let featuredImage = '';
        if (imageFilename && imageFilename.trim()) {
            const tempImagePath = path.join(__dirname, 'temp', imageFilename);
            if (fs.existsSync(tempImagePath)) {
                const blogId = generateSlug(title) + '-' + Date.now();
                const blogDir = path.join(__dirname, 'blogs', blogId);
                fs.ensureDirSync(blogDir);
                
                const imageExt = path.extname(imageFilename);
                const blogImageName = `featured${imageExt}`;
                const blogImagePath = path.join(blogDir, blogImageName);
                
                // Copy image to blog directory
                fs.copySync(tempImagePath, blogImagePath);
                featuredImage = blogImageName;
                console.log('Image copied to blog directory:', blogImagePath);
                
                // Add featured image to front matter
                config.frontMatter.featuredImage = featuredImage;
                config.frontMatter.image = featuredImage;
            }
        }
        
        // Save the blog
        const result = saveCorrectedBlog(title, description, content, config);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Blog saved successfully!',
                blogId: result.blogId,
                path: result.path,
                content: result.content
            });
        } else {
            res.json({
                success: false,
                message: result.message
            });
        }
        
    } catch (error) {
        console.error('Save corrected blog error:', error.message);
        res.json({ 
            success: false, 
            message: `Failed to save blog: ${error.message}` 
        });
    }
});

// Generate blog endpoint - now only generates content, doesn't save
app.post('/api/generate-blog', async (req, res) => {
    const { topic, description, altText, blogType, voice, additionalInstructions, imageFilename, categories, tags, series } = req.body;
    const config = getConfig();
    
    if (!config.deepseekApiKey || !config.deepseekApiKey.trim()) {
        return res.json({ 
            success: false, 
            message: 'DeepSeek API key not configured. Please go to Settings and add your API key.' 
        });
    }
    
    if (!topic || !topic.trim()) {
        return res.json({ 
            success: false, 
            message: 'Please enter a blog topic' 
        });
    }
    
    try {
        // Create prompt
        const prompt = createBlogPrompt(topic, blogType, voice, additionalInstructions);
        console.log('Generating blog with prompt length:', prompt.length);
        
        // Generate content using DeepSeek API
        const content = await generateWithDeepSeek(prompt, config.deepseekApiKey);
        
        // Create front matter with all new fields (but don't save yet)
        // Use first 4 words for image name
        const shortSlug = generateShortSlug(topic);
        
        // Sanitize title, description, and alt_text to remove colons (breaks Hugo YAML)
        const sanitizedTitle = sanitizeForFrontMatter(topic);
        const sanitizedDescription = sanitizeForFrontMatter(description || '');
        const sanitizedAltText = sanitizeForFrontMatter(altText || topic);
        
        // Determine image name if provided
        let featuredImage = '';
        if (imageFilename && imageFilename.trim()) {
            const imageExt = path.extname(imageFilename);
            featuredImage = `${shortSlug}${imageExt}`;
        }
        
        const frontMatter = {
            ...config.frontMatter,
            title: sanitizedTitle,
            date: new Date().toISOString(),
            draft: false,
            description: sanitizedDescription,
            series: Array.isArray(series) && series.length > 0 ? series : config.frontMatter.series || [],
            categories: Array.isArray(categories) && categories.length > 0 ? categories : config.frontMatter.categories || [],
            tags: Array.isArray(tags) && tags.length > 0 ? tags : config.frontMatter.tags || [],
            images: featuredImage ? [featuredImage] : [],
            alt_text: sanitizedAltText
        };
        
        // Create markdown content (but don't save to file yet)
        const markdownContent = createMarkdown(frontMatter, content);
        
        console.log('Blog generated successfully (not saved yet)');
        
        res.json({
            success: true,
            message: 'Blog generated successfully! Click "Save to Blog" to save it.',
            content: markdownContent,
            blogContent: content,
            shortSlug: shortSlug,
            featuredImage: featuredImage,
            imageFilename: imageFilename
        });
        
    } catch (error) {
        console.error('Error generating blog:', error.message);
        res.json({ 
            success: false, 
            message: `Error generating blog: ${error.message}` 
        });
    }
});

// New endpoint: Save blog to file (with first 4 words naming)
app.post('/api/save-blog', async (req, res) => {
    const { content, imageFilename, shortSlug } = req.body;
    const config = getConfig();
    
    if (!content || !content.trim()) {
        return res.json({ 
            success: false, 
            message: 'No content to save' 
        });
    }
    
    if (!config.hugoPath || !config.hugoPath.trim()) {
        return res.json({ 
            success: false, 
            message: 'Hugo/Blog path not configured. Please set it in Settings.' 
        });
    }
    
    try {
        // Create blog folder using first 4 words + timestamp
        const blogId = shortSlug + '-' + Date.now();
        const blogDir = path.join(config.hugoPath, blogId);
        fs.ensureDirSync(blogDir);
        
        // Handle image if provided - rename to first 4 words of title
        if (imageFilename && imageFilename.trim()) {
            const tempImagePath = path.join(__dirname, 'temp', imageFilename);
            if (fs.existsSync(tempImagePath)) {
                const imageExt = path.extname(imageFilename);
                const blogImageName = `${shortSlug}${imageExt}`;
                const blogImagePath = path.join(blogDir, blogImageName);
                
                // Copy image to blog directory
                fs.copySync(tempImagePath, blogImagePath);
                console.log('Image copied to blog directory:', blogImagePath);
            }
        }
        
        // Save the index.md file
        const blogPath = path.join(blogDir, 'index.md');
        fs.writeFileSync(blogPath, content);
        
        // Also save to local blogs folder for backup
        const localBlogDir = path.join(__dirname, 'blogs', blogId);
        fs.ensureDirSync(localBlogDir);
        fs.writeFileSync(path.join(localBlogDir, 'index.md'), content);
        if (imageFilename) {
            const tempImagePath = path.join(__dirname, 'temp', imageFilename);
            if (fs.existsSync(tempImagePath)) {
                const imageExt = path.extname(imageFilename);
                fs.copySync(tempImagePath, path.join(localBlogDir, `${shortSlug}${imageExt}`));
            }
        }
        
        console.log('Blog saved successfully:', blogPath);
        
        res.json({
            success: true,
            message: 'Blog saved successfully!',
            blogId: blogId,
            path: blogPath
        });
        
    } catch (error) {
        console.error('Error saving blog:', error.message);
        res.json({ 
            success: false, 
            message: `Error saving blog: ${error.message}` 
        });
    }
});

// Spell check endpoint for preview content
app.post('/api/spell-check', async (req, res) => {
    const { text } = req.body;
    const config = getConfig();
    
    if (!config.deepseekApiKey || !config.deepseekApiKey.trim()) {
        return res.json({ 
            success: false, 
            message: 'DeepSeek API key not configured. Please go to Settings and add your API key.' 
        });
    }
    
    if (!text || !text.trim()) {
        return res.json({ 
            success: false, 
            message: 'No text to check' 
        });
    }
    
    try {
        const correctedText = await correctSpellingGrammar(text, config.deepseekApiKey);
        
        res.json({
            success: true,
            message: 'Spell check complete!',
            original: text,
            corrected: correctedText
        });
        
    } catch (error) {
        console.error('Spell check error:', error.message);
        res.json({ 
            success: false, 
            message: `Spell check failed: ${error.message}` 
        });
    }
});

// Upload to server endpoint
app.post('/api/upload-server', async (req, res) => {
    const config = getConfig();
    
    if (!config.hugoPath || !config.hugoPath.trim()) {
        return res.json({ 
            success: false, 
            message: 'Hugo path not configured. Please set it in Settings.' 
        });
    }
    
    try {
        // Execute Hugo build command
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        console.log('Building Hugo site...');
        const { stdout: hugoOutput, stderr: hugoError } = await execPromise(
            `cd "${config.hugoPath}" && hugo`,
            { timeout: 60000 }
        );
        
        if (hugoError && !hugoError.includes('warning')) {
            throw new Error(`Hugo build error: ${hugoError}`);
        }
        
        // Check if SFTP is configured
        if (!config.sftp.host || !config.sftp.username) {
            return res.json({ 
                success: true, 
                message: 'Hugo site built successfully. SFTP not configured for deployment.' 
            });
        }
        
        // Here you would add SFTP upload logic
        // For now, just return success
        res.json({ 
            success: true, 
            message: 'Hugo site built successfully. SFTP upload would happen here.' 
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.json({ 
            success: false, 
            message: `Upload failed: ${error.message}` 
        });
    }
});

// Preview blog endpoint
app.post('/api/preview-blog', (req, res) => {
    const config = getConfig();
    
    if (!config.hugoPath || !config.hugoPath.trim()) {
        return res.json({ 
            success: false, 
            message: 'Hugo path not configured. Please set it in Settings.' 
        });
    }
    
    try {
        const { exec } = require('child_process');
        
        // Start Hugo server in background
        const hugoCommand = `cd "${config.hugoPath}" && hugo server --bind 0.0.0.0 --port 1313 --disableFastRender`;
        
        exec(hugoCommand, (error, stdout, stderr) => {
            if (error && !error.message.includes('already in use')) {
                console.error('Hugo server error:', error);
            } else {
                console.log('Hugo server started on http://localhost:1313');
            }
        });
        
        res.json({ 
            success: true, 
            message: 'Hugo preview server started. It may take a moment to be ready.',
            url: 'http://localhost:1313'
        });
        
    } catch (error) {
        console.error('Preview error:', error);
        res.json({ 
            success: false, 
            message: `Preview failed: ${error.message}` 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ✅ Blog Creator App is running!
    📍 Local: http://localhost:${PORT}
    
    ⚡ New Features Added:
    1. SEO Title Generation
    2. Blog Formatting from corrected text
    3. Save corrected blogs with selected titles
    
    Next steps:
    1. Visit http://localhost:${PORT}
    2. Configure settings at /settings
    3. Add your DeepSeek API key
    4. Start creating blogs!
    `);
});
