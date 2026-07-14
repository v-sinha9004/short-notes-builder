const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const port = 3001;

app.use(cors());
app.use(express.json());

// NOTEBOOKS
app.get('/api/notebooks', async (req, res) => {
  const notebooks = await prisma.notebook.findMany();
  res.json(notebooks);
});

app.post('/api/notebooks', async (req, res) => {
  const { title } = req.body;
  const notebook = await prisma.notebook.create({ data: { title } });
  res.json(notebook);
});

// SECTIONS
app.get('/api/sections/:notebookId', async (req, res) => {
  const { notebookId } = req.params;
  const sections = await prisma.section.findMany({ where: { notebookId } });
  res.json(sections);
});

app.post('/api/sections', async (req, res) => {
  const { notebookId, title } = req.body;
  const section = await prisma.section.create({ data: { notebookId, title } });
  res.json(section);
});

// PAGES
app.get('/api/pages/:sectionId', async (req, res) => {
  const { sectionId } = req.params;
  const pages = await prisma.page.findMany({ where: { sectionId } });
  res.json(pages);
});

app.post('/api/pages', async (req, res) => {
  const { sectionId, title } = req.body;
  const page = await prisma.page.create({ data: { sectionId, title } });
  res.json(page);
});

app.put('/api/pages/:id/content', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const page = await prisma.page.update({
    where: { id },
    data: { content }
  });
  res.json(page);
});

app.put('/api/pages/:id/revision', async (req, res) => {
  const { id } = req.params;
  const { revisionContent } = req.body;
  const page = await prisma.page.update({
    where: { id },
    data: { revisionContent }
  });
  res.json(page);
});

// AI ROUTE
app.post('/api/ai/generate', async (req, res) => {
  const { content, modelStr } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Backend missing OPENAI_API_KEY in server/.env file" });
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    const requestPayload = {
      model: modelStr || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert UPSC instructor creating a one-pager revision sheet.
          
          STRICT RULES:
          - Keep the revision sheet in the exact SAME format and structure as the original sheet.
          - ONLY use information from the provided original text. Do NOT add any external knowledge, facts, or internet data under any circumstances.
          - Do NOT remove anything important. Condense only the fluff to ensure it fits as a high-yield one-pager for quick revision.
          - Extract and highlight key facts (Articles, Dates, Committees, Judgments) ONLY if they already exist in the text.`
        },
        {
          role: "user",
          content: `Here are my notes. Create a UPSC revision sheet from this:\n\n${content}`
        }
      ]
    };

    if (modelStr && (modelStr.includes('5.5') || modelStr.includes('o1') || modelStr.includes('o3'))) {
      requestPayload.temperature = 1;
    } else {
      requestPayload.temperature = 0.3;
    }

    const response = await openai.chat.completions.create(requestPayload);
    res.json({ revisionContent: response.choices[0].message.content });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate revision sheet" });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
