import type { ChatMessage, SymptomEntry, MedicationEntry, DietEntry } from '../types';

/**
 * A helper function to extract a single value from an array of lines.
 * It iterates through lines, trims each one, and returns the first capture group of the first matching line.
 * This is robust against leading/trailing whitespace.
 * @param lines - An array of strings to search through.
 * @param regex - A RegExp with at least one capture group, ideally anchored with `^`.
 * @returns The captured string, or null if no match is found.
 */
const extractValueFromLines = (lines: string[], regex: RegExp): string | null => {
    for (const line of lines) {
        const match = line.trim().match(regex);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return null;
};


export const parseSymptomMessages = (messages: ChatMessage[]): SymptomEntry[] => {
    const entries: SymptomEntry[] = [];
    // Regex updated to be anchored to the start of a trimmed line, handle an optional leading dash, and work for both languages.
    const painLocationRegex = /^(?:- )?(?:Pain Location|통증 부위):\s*(.+)/;
    const painLevelRegex = /^(?:- )?(?:Pain Level|통증 수준):\s*(\d+)\/10/;
    
    for (const message of messages) {
        if (message.role === 'user' && (message.content.startsWith('[Symptom Log') || message.content.startsWith('[증상 기록'))) {
            try {
                const content = message.content;
                const dateMatch = content.match(/\[(?:Symptom Log|증상 기록)\s*-\s*(.+)\]/);
                if (!dateMatch?.[1]) continue;
                
                const date = new Date(dateMatch[1]);
                if (isNaN(date.getTime())) continue;

                const lines = content.split('\n');
                
                const painLocation = extractValueFromLines(lines, painLocationRegex);
                const painLevelStr = extractValueFromLines(lines, painLevelRegex);

                // Only create an entry if the essential information is found.
                if (painLocation && painLevelStr) {
                    const painLevel = parseInt(painLevelStr, 10);
                    entries.push({ date, painLevel, painLocation, summary: content });
                }
            } catch (e) { console.error("Failed to parse symptom message:", message.content, e); }
        }
    }
    return entries;
};

export const parseMedicationMessages = (messages: ChatMessage[]): MedicationEntry[] => {
    const entries: MedicationEntry[] = [];
    const nameRegex = /^(?:- )?(?:Medication Name|약 이름):\s*(.+)/;
    const timeOfDayRegex = /^(?:- )?(?:Time of Day|시간대):\s*(.+)/;
    const timeOfDayMap: { [key: string]: MedicationEntry['timeOfDay'] } = { 'Morning':'Morning', 'Lunch':'Lunch', 'Dinner':'Dinner', 'Bedtime':'Bedtime', '아침':'Morning', '점심':'Lunch', '저녁':'Dinner', '취침 전':'Bedtime' };
    
    for (const message of messages) {
        // Corrected to look for "[Medication Log" instead of "[Medication Logged".
        if (message.role === 'user' && (message.content.startsWith('[Medication Log') || message.content.startsWith('[복용 기록'))) {
             try {
                const content = message.content;
                const dateMatch = content.match(/\[(?:Medication Log|복용 기록)\s*-\s*(.+)\]/);
                if (!dateMatch?.[1]) continue;
                
                const date = new Date(dateMatch[1]);
                if (isNaN(date.getTime())) continue;
                
                const lines = content.split('\n');
                const medicationName = extractValueFromLines(lines, nameRegex);
                const timeOfDayValue = extractValueFromLines(lines, timeOfDayRegex);
                const mappedTimeOfDay = timeOfDayValue ? timeOfDayMap[timeOfDayValue] : null;

                if (medicationName && mappedTimeOfDay) {
                    entries.push({ date, medicationName, timeOfDay: mappedTimeOfDay, summary: content });
                }
            } catch (e) { console.error("Failed to parse medication message:", message.content, e); }
        }
    }
    return entries;
};

export const parseDietMessages = (messages: ChatMessage[]): DietEntry[] => {
    const entries: DietEntry[] = [];
    const foodRegex = /^(?:- )?(?:Food\/Meal Description|음식\/식사 설명):\s*(.+)/s; // s flag for multi-line meals
    const timeOfDayRegex = /^(?:- )?(?:Time of Day|시간대):\s*(.+)/;
    const timeOfDayMap: { [key: string]: DietEntry['timeOfDay'] } = { 'Breakfast':'Breakfast', 'Lunch':'Lunch', 'Dinner':'Dinner', 'After Dinner':'After Dinner', '아침':'Breakfast', '점심':'Lunch', '저녁':'Dinner', '저녁 이후':'After Dinner' };

    for (const message of messages) {
        // Corrected to look for "[Diet Log" instead of "[Diet Logged".
        if (message.role === 'user' && (message.content.startsWith('[Diet Log') || message.content.startsWith('[식단 기록'))) {
            try {
                const content = message.content;
                const dateMatch = content.match(/\[(?:Diet Log|식단 기록)\s*-\s*(.+)\]/);
                if (!dateMatch?.[1]) continue;

                const date = new Date(dateMatch[1]);
                if (isNaN(date.getTime())) continue;

                const lines = content.split('\n');

                // For diet, the description itself can be multi-line. We need a different approach than extractValueFromLines.
                let foodDescription : string | null = null;
                const foodLineIndex = lines.findIndex(line => line.trim().match(/^(?:- )?(?:Food\/Meal Description|음식\/식사 설명):/));
                if (foodLineIndex !== -1) {
                    // Extract the part after the colon on the first line
                    const firstLineMatch = lines[foodLineIndex].match(/^(?:- )?(?:Food\/Meal Description|음식\/식사 설명):\s*(.*)/);
                    let description = firstLineMatch ? firstLineMatch[1] : '';
                    // Append subsequent lines until we hit another key-value pair or the end
                    for (let i = foodLineIndex + 1; i < lines.length; i++) {
                        if (lines[i].match(/^\s*-\s*\w+.*:/)) { // Heuristic: stop if a line looks like another data point (e.g., "- Time of Day:")
                            break;
                        }
                        description += '\n' + lines[i];
                    }
                    foodDescription = description.trim();
                }
                
                const timeOfDayValue = extractValueFromLines(lines, timeOfDayRegex);
                const mappedTimeOfDay = timeOfDayValue ? timeOfDayMap[timeOfDayValue] : null;

                if (foodDescription && mappedTimeOfDay) {
                    entries.push({ date, foodDescription, timeOfDay: mappedTimeOfDay, summary: content });
                }
            } catch (e) { console.error("Failed to parse diet message:", message.content, e); }
        }
    }
    return entries;
};
