Light Pad
==================

This is some code I threw together to program a Launchpad X light show. 

<iframe width="1280" height="720" src="https://www.youtube-nocookie.com/embed/2WCEHGqT_yE?start=47&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>

To run from source: 

	npm install
	npm run tauri dev

To build an executable: 

	npm run tauri build

More steps about the build process can be figured out by Googling Tauri and Svelte. 


Using the program
--------------------

Plugin in your launchpad X prior to booting up the program.

The layout is divided into 2 areas

1. The clip sequencer on the left
2. The keyframe editor on the right

A project is divided into clips. Each clip contains zero or more keyframes placed on a beat. Each keyframe describes what lights are currently on at that moment in time.

### Clip Sequencer ###

Clips are created by clicking on the grid. Once created, their length can be changed by clicking at the start/end of the clip and dragging it. They can also be dragged to a different position in the sequencer. 

To delete a clip, select it with the mouse and press backspace.

To copy a clip, select it with the mouse, then use Ctrl+C, Ctrl+V to paste it in the same track at the next available spot.

Use the Play/Stop button or the space key to play the sequence of clips back. You can change where playback starts by clicking at the top of the sequencer where the measure numbers are. Clips are composited together with the tracks on top overlaying the tracks on bottom - any lights not turned on by those clips can be turned on by lower clips.

When a clip reaches its end, all its lights are turned off.  

### Keyframe Editor ###

When you click a clip, it opens up in the keyframe editor. To create a keyframe, click an empty beat "\_" in the keyframe list. This will copy the current keyframe over, allowing you to easily make changes over time. The keyframe can later be modified by clicking the "x" on that beat. Keyframes can be deleted by opening the keyframe and then pressing "D".

When a keyframe is open, you can change what lights are lit on the launchpad at that time. Click the color selector to change the color of the light, and then hold down the mouse to paint that color on the launchpad grid. You can right click a color on the grid to select that color.

To play a single clip in isolation, use the play button in the keyframe editor.









