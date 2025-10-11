# Gemini Image Reference

Gemini can create, edit, and iterate on images with the same API surface used for text generation. This guide captures the patterns that tend to come up when building image features.

## Prerequisites

- A Gemini API key with Image generation access. Create one in [Google AI Studio](https://aistudio.google.com/).
- Store the key as an environment variable named `GEMINI_API_KEY` (or `GOOGLE_API_KEY`; `GEMINI_API_KEY` wins if both exist). The [official docs](https://ai.google.dev/gemini-api/docs/api-key#set-api-env-var) describe platform-specific setup.

### Create the client

```js
const module = await import("https://esm.sh/@google/genai@1.22.0");
const { GoogleGenAI, Modality } = module;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_ID = "gemini-2.5-flash-image";
```

_The examples below assume top-level `await` (Node.js 20+, modern bundlers). Wrap them in an `async` function if your runtime does not support it._

## Generate images

Call `generateContent` with your prompt. Set `responseModalities` if you want the service to return text alongside image bytes.

```js
const prompt = "Create a photorealistic Siamese cat with heterochromia and red facial patches.";

const response = await ai.models.generateContent({
  model: MODEL_ID,
  contents: prompt,
  config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
});

let catImage;
for (const part of response.candidates[0].content.parts) {
  if (part.text) console.log(part.text);
  if (part.inlineData) {
    catImage = part.inlineData.data;
    console.image(catImage);
  }
}
```

Sample output:

![Gemini generated cat](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/cat.png)

## Edit images

Send the original image via `inlineData` and describe the change in the prompt. Gemini keeps character details consistent.

```js
const textPrompt = "Create a side-view picture of the same cat in a tropical forest eating a nano banana under the stars.";

const editResponse = await ai.models.generateContent({
  model: MODEL_ID,
  contents: [
    { text: textPrompt },
    { inlineData: { data: catImage, mimeType: "image/png" } },
  ],
});

// Update catImage so you can iterate on the latest version.
for (const part of editResponse.candidates[0].content.parts) {
  if (part.inlineData) catImage = part.inlineData.data;
  if (part.text) console.log(part.text);
}
```

More samples:

- ![Cat in tropical forest](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/cat_tropical.png)
- ![Cat in restaurant](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/cat_restaurant.png)

## Request multiple images or storyboards

Gemini can deliver a sequence of images for tutorials or narratives. Iterate through `inlineData` parts to render each image.

```js
const storyResponse = await ai.models.generateContent({
  model: MODEL_ID,
  contents: "Show me how to bake macarons with images.",
});

for (const part of storyResponse.candidates[0].content.parts) {
  if (part.text) console.log(part.text);
  if (part.inlineData) console.image(part.inlineData.data);
}
```

Example story snippets:

- ![Azure tone story](https://storage.googleapis.com/generativeai-downloads/images/azuretones.png) (stitched sequence)
- ![Macaron step 1](https://storage.googleapis.com/generativeai-downloads/images/macaron_step1.png)
- ![Macaron step 2](https://storage.googleapis.com/generativeai-downloads/images/macaron_step2.png)
- ![Macaron step 3](https://storage.googleapis.com/generativeai-downloads/images/macaron_step3.png)
- ![Macaron step 4](https://storage.googleapis.com/generativeai-downloads/images/macaron_step4.png)
- ![Macaron step 5](https://storage.googleapis.com/generativeai-downloads/images/macaron_step5.png)
- ![Macaron step 7](https://storage.googleapis.com/generativeai-downloads/images/macaron_step7.png)

## Chat mode (recommended for iteration)

Chat keeps context, so you can build on previous results without resending images manually.

```js
const chat = ai.chats.create({ model: MODEL_ID });

let response = await chat.sendMessage({
  message: "Create an image of a plastic toy fox figurine in a kid's bedroom. Accessories welcome, no weapons.",
});

let foxFigurineImage;
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) foxFigurineImage = part.inlineData.data;
  if (part.text) console.log(part.text);
}
```

Subsequent turns reuse the chat:

```js
response = await chat.sendMessage({
  message: "Add a blue planet on the figurine's helmet.",
});

for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) console.image(part.inlineData.data);
  if (part.text) console.log(part.text);
}
```

Sample iterations:

- ![Figurine base](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/figurine.png)
- ![Figurine with planet](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/figurine_helmet.png)
- ![Figurine on beach](https://iili.io/K2AvYIR.png)
- ![Figurine base-jumping](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/figurine_space.png)
- ![Figurine cooking](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/figurine_bbq.jpg)
- ![Figurine in spa](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/figurine_spa.jpg)

## Mix multiple pictures

Send up to three `inlineData` attachments to blend characters, backgrounds, or products.

```js
const mashupPrompt = "Create a picture of the figurine riding the cat in a fantasy world.";

const mashupResponse = await ai.models.generateContent({
  model: MODEL_ID,
  contents: [
    { text: mashupPrompt },
    { inlineData: { data: catImage, mimeType: "image/png" } },
    { inlineData: { data: foxFigurineImage, mimeType: "image/png" } },
  ],
});

for (const part of mashupResponse.candidates[0].content.parts) {
  if (part.inlineData) console.image(part.inlineData.data);
}
```

Result sample:

![Figurine riding cat](https://storage.googleapis.com/generativeai-downloads/cookbook/image_out/figurine_riding.png)

## Next steps

### Documentation

- [Image generation overview](https://ai.google.dev/gemini-api/docs/image-generation#gemini)
- [Prompt guide](https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide)

### Explore in AI Studio

- [Past Forward](https://aistudio.google.com/apps/bundled/past_forward) — time travel reimaginings
- [Home Canvas](https://aistudio.google.com/apps/bundled/home_canvas) — remix interiors
- [Gembooth](https://aistudio.google.com/apps/bundled/gembooth) — portrait transformations
- [Gemini Co-drawing](https://aistudio.google.com/apps/bundled/codrawing) — collaborate on sketches
- [Pixshop](https://aistudio.google.com/apps/bundled/pixshop) — AI-powered image editing

### Related models

- [Imagen](https://ai.google.dev/gemini-api/docs/imagen) — alternate generator; try the [Get Started with Imagen notebook](./Get_started_imagen.ipynb)
- [Spatial understanding quickstart](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Spatial_understanding.ipynb)
- [Video understanding quickstart](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Video_understanding.ipynb)
