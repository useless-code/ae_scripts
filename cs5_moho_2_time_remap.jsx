// This script reads a user specified MOHO.dat text file and
// creates a time remapped layer with the frame values from the MOHO.dat file.
// The new comp is called "my MOHO comp"
// Developed and tested only on After Effects CS3, no gaurantee it will work on other versions.
//
// By Atom
// 04/11/2012
//
// This script is released under the CC-BY license.
// http://creativecommons.org/licenses/by/3.0/
// Because it is not practical for the user to credit me in all occasions,
// I allow users to create content with this script without crediting Atom directly in their published work,
// however, any derived script modifications or distributions of this script must contain this comment and credit Atom.
// This script can not be bundled or added to books or electronic publishing without consulting Atom first.
// Changes and fixes for use with Papagayo LipSync Software by Joaquín Sorianello <joac@joac.com.ar>

{
    // Begin small function library.
    function isNumeric(val) {
        if (isNaN(parseFloat(val))) {
              return false;
         }
         return true
    }
    function returnFrameFromItem(passedItem) {
        result = -1;
        lst = passedItem.split(' ');
        if (lst.length > 0) {
            if (isNumeric(lst[0]) == true) {
                result = parseInt(lst[0]);
            }
        }
        return result;
    }
    function returnPhonemeFromItem(passedItem) {
        result = "";
        lst = passedItem.split(' ');
        if (lst.length > 0) {
            if (isNumeric(lst[0]) == true) {
                result = lst[1];
            }
        }
        return result;
    }
    function returnPhonemeForFrame (passedList, passedFrame) {
        result = "";
        l = passedList.length;
        for (n = 0; n <l; n++) {
            item = passedList[n];
            f = returnFrameFromItem(item);
            if (f == passedFrame) {
                result = returnPhonemeFromItem(item);
                break;
            }
        }
        return result;
    }
    function returnTimeRemapFrameFromPhoneme(passedItem) {
       // NOTE: This assumes you have a frame in a comp for each phoneme listed in this order (i.e. alphabetically).
         switch(passedItem) {
            case 'A':
                f = 0;
                break;
            case 'E':
                f = 1;
                break;
            case 'etc':
                f = 2;
                break;
            case 'FV':
                f = 3;
                break;
            case 'I':
                f = 4;
                break;
            case 'L':
                f = 5;
                break;
            case 'MBP':
                f = 6;
                break;
            case 'O':
                f = 7;
                break;
            case 'rest':
                f = 8;
                break;
            case 'U':
                f = 9;
                break;
            case 'WQ':
                f = 10;
                break;
            case 'TH':
                // Not part of preston-blair default.
                // This part of preston-blair extended.
                f = 11;
                break;
            default:
                f = -1;
                break;
        }
        return f;
    }
    // End small function library.

    // Create undo group
    app.beginUndoGroup("Create Lip-Synch From MOHO File");

    // Detect the selected comp in the project bin.
    var projectSelection = app.project.selection;
    pl = projectSelection.length;
    if (pl == 1)
    {
        // create project if necessary
        var proj = app.project;
        if(!proj) proj = app.newProject();

        // create new comp named 'my MOHO comp'
        var compW = 1280;   // comp width
        var compH = 720;    // comp height
        var compL = 30;     // comp length (seconds)
        var compRate = 24;  // comp frame rate (24fps is the default fps for Papagoya, adjust as needed.)
        var compBG = [48/255,63/255,84/255] // comp background color

        var myItemCollection = app.project.items;
        var myComp = myItemCollection.addComp('my MOHO comp',compW,compH,1,compL,compRate);
        myComp.bgColor = compBG;

        // Prompt user to select text file
		var myFile = File.openDialog("Select a MOHO.dat text file to open.", "*.dat");
		if (myFile != null)
		{
			// open file
			var fileOK = myFile.open("r","MOHO","????");
            if (fileOK)
            {
                for (i=0; i < pl; i++)
                {
                    //Add comp
                    if(projectSelection[i] instanceof CompItem)                 // Test to be sure it is a comp.
                    {
                        thisLayer = myComp.layers.add(projectSelection[i]);    // Add the selected comp as a layer to the MOHO comp.
                        thisLayer.timeRemapEnabled = true;                      // Enable time remapping.
                        myRemap= thisLayer.property("Time Remap");
                        // By default two keyframes are added when time remap is enabled.
                        // Let's remove the first one now, effectively making this a freeze frame.
                        myRemap.removeKey(1);
                    }
                }
                // Read the text file to get the frame numbers to generate keyframes on.
                var s = "";
                var lastValue = -1;
                var lastLine = "";
                var lstLines = [];
                var n = 0;
                var l = 0;
                var f = 0;
                while (!myFile.eof)
                {
                    text = myFile.readln();
                    if (text != lastLine) {
                        if (text != undefined)
                        {
                            f = returnFrameFromItem(text);
                            if (f != -1) {
                                // Only add valid lines of text to the list.
                                lstLines.push(text);
                                lastLine = text;
                                n = n + 1;
                            }
                        }
                    }
                }
                // Close the file.
                myFile.close();

                // Add a rest phoneme, if frame 0 not is set
                if (returnFrameFromItem[lstLines[0]] != 0){
                  lstLines.splice(0, 0, '0 rest');
                };

                // Get the last frame number that has a phoneme.
                l = lstLines.length;
                last_frame = returnFrameFromItem(lstLines[l-1]);
                if (last_frame != -1) {
                    first_frame = returnFrameFromItem (lstLines[0]);

                    if (first_frame != -1)
                    {
                        cur_frame = first_frame;
                        // Create a time remap keyframe for every frame.
                        for (n=0;n<l;n++)
                        {
                            // Save Frame numbers
                            i = returnFrameFromItem(lstLines[n])
                            cur_phoneme = returnPhonemeForFrame(lstLines,i);
                            if (cur_phoneme != "")
                            {
                                if (isNumeric(cur_phoneme) == false)
                                {
                                    // Fetch the frame we should be using based upon the phoneme.
                                     cur_frame = returnTimeRemapFrameFromPhoneme(cur_phoneme);
                                    if (cur_frame == -1)
                                    {
                                        // Ok, what is wrong...?
                                        s = parseInt(i) + ", " + parseInt(first_frame) + ", " + parseInt(last_frame) + ", " + parseInt(cur_frame) + ", " + cur_phoneme;
                                        alert("Bad phoneme [" + s + "] encountered.");
                                    }
                                }
                            }
                            frame_as_time = i/compRate;
                            frame_remap_as_time = cur_frame/compRate;
                            myRemap.setValueAtTime(frame_as_time,frame_remap_as_time);
                            if (i == first_frame) {
                                // Remove the final keyframe that was generated when time remap was enabled.
                                myRemap.removeKey(1);
                            }
                        }
                        // Lets go ahead and extend our outpoint to the last frame we detected in our MOHO.dat file.
                        thisLayer.outPoint = last_frame/compRate;
                    } else {
                        alert("First frame is -1.");
                    }
                } else {
                    alert("Last frame is -1.");
                }
            } else {
                alert("Problem with MOHO.dat file..?");
            }
        } else {
            s = "User canceled operation.";
        }
    } else {
      alert("Select a single composition with your phoneme mouth images\nbefore you run this script.");
    }
    app.endUndoGroup();
}
