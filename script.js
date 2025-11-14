// --- 1. Game Variables & State ---
let sceneData = [];
let currentSceneId = "introduction";
let currentDialogueIndex = 0;
let isFetching = false;
let gameFinished = false;

// --- 2. DOM Element References ---
const gameContainer = document.getElementById('game-container');
const charName = document.getElementById('character-name');
const dialogueText = document.getElementById('dialogue-text');
const characterSpriteLeft = document.getElementById('character-sprite-left');
const characterSpriteRight = document.getElementById('character-sprite-right');
const nextButton = document.getElementById('next-button');
const choicesContainer = document.getElementById('choices-container'); 

// --- 3. Utility Function: Fetch and Load Data ---
async function loadStory() {
    if (isFetching) return;
    isFetching = true;
    try {
        const response = await fetch('scenes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        sceneData = await response.json();
        console.log("Story data loaded:", sceneData);
        // Start the game after data is loaded
        advanceStory();
    } catch (error) {
        console.error("Could not load story data:", error);
        charName.textContent = "Error";
        dialogueText.textContent = "Failed to load story data. Check console for details.";
        nextButton.disabled = true;
    } finally {
        isFetching = false;
    }
}

function resetGame() {
    // Reset state variables
    currentSceneId = "introduction";
    currentDialogueIndex = 0;
    gameFinished = false;
    
    // Reset UI elements
    nextButton.disabled = false;
    nextButton.textContent = "Next >>";
    nextButton.style.display = 'block';
    choicesContainer.innerHTML = '';
    
    // Clear sprites and set default background/text
    characterSpriteLeft.src = "";
    characterSpriteRight.src = "";
    characterSpriteLeft.style.opacity = 0;
    characterSpriteRight.style.opacity = 0;
    charName.textContent = "Narrator";
    dialogueText.textContent = "Welcome to the start of the story! Click 'Next' to continue.";
    
    // Rerun the game from the start
    advanceStory("introduction");
}


// --- 4. Main Function to Advance the Story ---
function advanceStory(nextSceneId = null) {
    if (gameFinished) return; // Prevent advancement if the game is over

    // 4.1. Handle Scene Transition
    if (nextSceneId !== null) {
        currentSceneId = nextSceneId;
        currentDialogueIndex = 0; // Always reset dialogue index for a new scene
        choicesContainer.innerHTML = ''; // Clear choices from previous scene
    }

    const currentScene = sceneData.find(scene => scene.sceneId === currentSceneId);

    if (!currentScene) {
        // Handle Game Over or Missing Scene ID
        charName.textContent = "Game Over";
        dialogueText.textContent = `The scene ID '${currentSceneId}' was not found.`;
        nextButton.disabled = true;
        nextButton.textContent = "FIN";
        gameFinished = true;
        return;
    }

    const dialogue = currentScene.dialogue;

    // 4.2. Check for End of Dialogue in Current Scene
    if (currentDialogueIndex >= dialogue.length) {
        const defaultNextSceneId = currentScene.nextSceneId;

        if (defaultNextSceneId && defaultNextSceneId !== "") {
            // Automatically transition to the next scene if no choice was made and nextSceneId is set
            advanceStory(defaultNextSceneId);
        } else {
            // --- End of Story/Branch Handling (Game Finished) ---
            gameFinished = true;
            nextButton.style.display = 'none'; // Hide the Next button

            charName.textContent = "The End";
            dialogueText.textContent = "Thank you for playing this game! Press 'Play Again' to restart.";
            
            // Create the Play Again button
            const restartButton = document.createElement('button');
            restartButton.textContent = "Play Again";
            restartButton.classList.add('choice-button'); // Reuse choice-button style
            restartButton.style.marginTop = '10px';
            restartButton.style.textAlign = 'center';

            restartButton.addEventListener('click', () => {
                resetGame(); // Call the new reset function
            });

            choicesContainer.appendChild(restartButton);
        }
        return;
    }

    // --- 4.3. Get the current dialogue object  ---
    const currentDialogue = dialogue[currentDialogueIndex];
    if (currentScene.backgroundImage) {
        gameContainer.style.backgroundImage = `url('${currentScene.backgroundImage}')`;
    }

    // Update the dialogue box
    charName.textContent = currentDialogue.characterName;
    dialogueText.textContent = currentDialogue.text;

    // --- Character Sprite Logic ---

    // Clear classes from both sprites first
    characterSpriteLeft.classList.remove('active-sprite', 'inactive-sprite');
    characterSpriteRight.classList.remove('active-sprite', 'inactive-sprite');

    // 1. Handle Character 1 (Left)
    if (currentDialogue.character1Image) {
        characterSpriteLeft.src = currentDialogue.character1Image;
        characterSpriteLeft.style.opacity = 1; // Show sprite if image exists
    } else {
        characterSpriteLeft.src = "";
        characterSpriteLeft.style.opacity = 0; // HIDE SPRITE if no image
    }

    // 2. Handle Character 2 (Right)
    if (currentDialogue.character2Image) {
        characterSpriteRight.src = currentDialogue.character2Image;
        characterSpriteRight.style.opacity = 1; // Show sprite if image exists
    } else {
        characterSpriteRight.src = "";
        characterSpriteRight.style.opacity = 0; // HIDE SPRITE if no image
    }

    // 3. Apply Focus/Active Class
    const char1Visible = characterSpriteLeft.style.opacity == 1;
    const char2Visible = characterSpriteRight.style.opacity == 1;

    if (currentDialogue.characterName !== "Narrator") {
        if (currentDialogue.currentlyTalking === 'character1' && char1Visible) {
            // Character 1 (Left) is speaking
            characterSpriteLeft.classList.add('active-sprite');
            if (char2Visible) characterSpriteRight.classList.add('inactive-sprite');
        } else if (currentDialogue.currentlyTalking === 'character2' && char2Visible) {
            // Character 2 (Right) is speaking
            characterSpriteRight.classList.add('active-sprite');
            if (char1Visible) characterSpriteLeft.classList.add('inactive-sprite');
        } else {
            // Fallback for dialogue where speaker isn't explicitly defined/Narrator
            if (char1Visible) characterSpriteLeft.classList.add('inactive-sprite');
            if (char2Visible) characterSpriteRight.classList.add('inactive-sprite');
        }
    } else {
         // Narrator or no specific speaker - dim any visible sprites
        if (char1Visible) characterSpriteLeft.classList.add('inactive-sprite');
        if (char2Visible) characterSpriteRight.classList.add('inactive-sprite');
    }


    // 4.4. Handle Choices
    if (currentDialogue.choices && currentDialogue.choices.length > 0) {
        nextButton.style.display = 'none'; // Hide the Next button
        choicesContainer.innerHTML = ''; // Clear previous choices

        currentDialogue.choices.forEach(choice => {
            const choiceButton = document.createElement('button');
            choiceButton.textContent = choice.choiceText;
            choiceButton.classList.add('choice-button');
            choiceButton.addEventListener('click', () => {
                // When a choice is made, transition to the next scene
                nextButton.style.display = 'block';
                advanceStory(choice.nextSceneId);
            });
            choicesContainer.appendChild(choiceButton);
        });
    } else {
        // No choices, proceed to next dialogue on button click
        nextButton.style.display = 'block';
        choicesContainer.innerHTML = ''; // Ensure choices are cleared
        currentDialogueIndex++; // Prepare for the next dialogue line
    }
}

// --- 5. Event Listener ---
nextButton.addEventListener('click', () => advanceStory(null));

// --- 6. Initialization ---
loadStory(); // Start the process of loading and then starting the story