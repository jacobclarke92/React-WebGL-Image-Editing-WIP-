# React WebGL Image Editing

**This is a work in progress**


I've made a few classes to wrap native WebGL.  
I'm using react for the UI and as a way of passing edit step info to the Renderer component.


I've also created a node script to that uses headless-gl to render edits so it can be serverside.


## Installation

For a start node.js + npm is requied.

You'll probably need to install `babel-cli` globally if you plan on using the nodeJS server renderer

`npm install -g babel-cli`

In addition to this the nodeJS renderer relies on `node-canvas` dependencies which can be installed by running

`chmod +x ./preinstall.sh && ./preinstall.sh`

Then do the standard

`npm install`


There are 3 npm scripts set up

- `npm run start` fires up the react-hot-loader
- `npm run watch` just runs webpack with watch flag, byo localhost
- `npm run deploy` compiles and minifies

## Concept

The overall aim of this is to create a VSCO-esque app.  
There are two main parts to this:

1. The UI and instructions generation
2. The WebGL renderer
2.5. The serverside renderer

I've kept these two parts seperate from one another so the renderer can be implmented with any UI in the future.

The UI provides the Renderer with edit steps. It takes into account the user adjustments first and then adds the currently selected 'filter preset' steps on top of that.  
Some of the user adjustments may not correspond with a core shader effect so I use a sort of middleware to take one command and turn it into another.  
An example of this is 'temperature' which takes a single input and converts it into a colorMatrix step.  
All of the middleware filters can be found in `editor/filters.js`  
All of the core shader effects can be found in `editor/shaders/index.js`  


## Serverside

While totally optional the nodeJS renderer offers an alternative using a GUI. It takes input, output and `instructions` as JSON string. The major advantage of using nodeJS is that I'm able to use the same WebGL render code as in the front-end to create identical results. 

As mentioned above a global install of babel-cli is required to run the node script.

An example of what a command might look like is

`sudo xvfb-run -s "-ac -screen 0 1x1x24" babel-node ./backend/index.js input=test_image.jpg instructions="[{\"name\":\"adjustments\",\"steps\":[{\"key\":\"gamma\",\"value\":2.1}]}]"`


## WebGL

I was completely new to WebGL upon starting this and I'm still learning as I go along.  
Early on I identified the need to put some of the 'boilerplate' webGL stuff into classes for my own sanity due to the sheer amount of code required to do basic things.  
These classes are still in flux and I'll keep editing them as needs arise.  
The main classes are currently:
- Program
- Texture
- Framebuffer

#### Program

Each edit step provided to the Renderer creates a webgl program.  
The Program class takes on a gl instance and has basic functions such as:  
- destroy
- use 
- resize

Two of its functions 'uniforms' and 'textures' were borrowed from glfx.js's core 'shader.js' class, and are used to update uniforms and texture uniforms.  
The other functions get executed in this order and require a bit more understanding on my part:
- 'update' uniforms
- 'willRender'
- [other stuff]
- 'didRender'
- 'draw'

The current overall process is as follows:
- each edit step creates a program
- upon iterating over the edit steps the following happens:
  - 'use' current step's program
  - 'update' that program's unforms
  - 'willRender' to update texture coord and buffer [[unclear on how/why this works]]
  -  take source (either image texture or previous framebuffer) and bind it to target (either hopping between two framebuffers or straight to canvas if last step)
  - 'didRender' to ... set a buffer reactangle [[unclear on how/why this works also]]
  - 'draw' simply runs drawArrays

#### Texture

Texture is a lot more straightforward. It takes in a gl instace, width, height and format + type (optional).  
Once a texture class is instantiated it can be loaded with one of the following:
- 'loadContentsOf' takes a native dom element, in this instance just Image, but I assume video works more or less the same way (untested & unimplemented).
- 'loadFromBytes' takes a UTF8 byte array containing rgba values, appropriate width and height must be specified.
- 'loadEmpty' creates an empty texture

The only other functions are 'destroy', 'use' and 'unuse'. 'Use' binds texture with an optional argument to set as activeTexture, 'unuse' does the same but sets null for both instead.

#### FramebufferTexture

This class is more specific to my use case rather than as a webGL wrapper.  
Basically it can create a framebuffer either from a source texture or as an empty texture.
Same fuctions apply - 'destroy', 'use', 'unuse'.