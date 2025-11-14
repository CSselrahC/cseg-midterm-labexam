// --- 1. Game Variables & State ---
let sceneData = [];
let currentSceneId = "introduction";
let currentDialogueIndex = 0;
let isFetching = false;

// --- 2. DOM Element References ---
const gameContainer = document.getElementById('game-container');
const charName = document.getElementById('character-name');
const dialogueText = document.getElementById('dialogue-text');
const characterSpriteLeft = document.getElementById('character-sprite-left');
const characterSpriteRight = document.getElementById('character-sprite-right');
const nextButton = document.getElementById('next-button');

const choicesContainer = document.createElement('div');
choicesContainer.id = 'choices-container';
gameContainer.appendChild(choicesContainer);

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

// --- 4. Main Function to Advance the Story ---
function advanceStory(nextSceneId = null) {
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
        return;
    }

    const dialogue = currentScene.dialogue;

    // 4.2. Check for End of Dialogue in Current Scene
    if (currentDialogueIndex >= dialogue.length) {
        const defaultNextSceneId = currentScene.nextSceneId;

        if (defaultNextSceneId) {
            // Automatically transition to the next scene if no choice was made and nextSceneId is set
            advanceStory(defaultNextSceneId);
        } else {
            // End of story or branch
            charName.textContent = "The End";
            dialogueText.textContent = "Thank you for playing this game!";
            nextButton.disabled = true;
            nextButton.textContent = "FIN";
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
        characterSpriteLeft.style.opacity = 0; // **HIDE SPRITE if no image**
    }

    // 2. Handle Character 2 (Right)
    if (currentDialogue.character2Image) {
        characterSpriteRight.src = currentDialogue.character2Image;
        characterSpriteRight.style.opacity = 1; // Show sprite if image exists
    } else {
        characterSpriteRight.src = "";
        characterSpriteRight.style.opacity = 0; // **HIDE SPRITE if no image**
    }

    // 3. Apply Focus/Active Class
    if (currentDialogue.currentlyTalking === 'character1' && currentDialogue.character1Image) {
        // Character 1 (Left) is speaking and has an image
        characterSpriteLeft.classList.add('active-sprite');
        if (currentDialogue.character2Image) {
            characterSpriteRight.classList.add('inactive-sprite');
        }
    } else if (currentDialogue.currentlyTalking === 'character2' && currentDialogue.character2Image) {
        // Character 2 (Right) is speaking and has an image
        characterSpriteRight.classList.add('active-sprite');
        if (currentDialogue.character1Image) {
            characterSpriteLeft.classList.add('inactive-sprite');
        }
    } else if (currentDialogue.characterName === "Narrator") {
        // Narrator or no specific speaker - dim any visible sprites
        if (currentDialogue.character1Image) {
            characterSpriteLeft.classList.add('inactive-sprite');
        }
        if (currentDialogue.character2Image) {
            characterSpriteRight.classList.add('inactive-sprite');
        }
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