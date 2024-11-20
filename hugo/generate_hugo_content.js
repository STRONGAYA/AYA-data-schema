const fs = require('fs');
const path = require('path');

// Load the JSON data
const data = require('../AYA_cancer_schema.json');
const fieldsToDisplay = require('./config/schema_fields_to_display.json');

const variableInfo = data.variable_info;

// Generate Markdown content for each variable
Object.keys(variableInfo).forEach(variable => {
    // Fetch the fields to display for the variable, or use the default fields
    const fields = fieldsToDisplay.variable_info[variable] || fieldsToDisplay.variable_info.default || [];
    let content = `---\ntitle: "${variable}"\n---\n# ${variable}\n`;

    fields.forEach(field => {
        if (field === 'value_mapping' && variableInfo[variable][field]) {
            const valueMapping = variableInfo[variable][field].terms;
            content += `**Allowed values**:\n`;
            Object.keys(valueMapping).forEach(term => {
                content += `    ${term.charAt(0).toUpperCase() + term.slice(1)}\n`;
                content += `        class: ${valueMapping[term].target_class}\n`;
            });
        } else {
            content += `**${field.replace('_', ' ')}**: ${JSON.stringify(variableInfo[variable][field], null, 2)}\n\n`;
        }
    });

    // Process schema_reconstruction field
    const schemaReconstruction = variableInfo[variable].schema_reconstruction || [];
    let lastClassDir = null;

    schemaReconstruction.forEach(reconstruction => {
        if (reconstruction.type === 'class') {
            const classLabels = schemaReconstruction
                .filter(rec => rec.type === 'class')
                .map(rec => rec.aesthetic_label);

            lastClassDir = path.join(__dirname, 'content', 'AYA-cancer-data-schema', 'codebook', ...classLabels);

            // Create the directory if it does not exist
            if (!fs.existsSync(lastClassDir)) {
                fs.mkdirSync(lastClassDir, {recursive: true});
            }

            // Create the _index.md file in the directory
            const indexContent = `---\nbookCollapseSection: true\nweight: 20\n---\n# ${classLabels[classLabels.length - 1]}\nClass shortcode: ${reconstruction.class}\n`;
            fs.writeFileSync(path.join(lastClassDir, '_index.md'), indexContent);
        }
    });

    // Add node type information to the content
    schemaReconstruction.forEach(reconstruction => {
        if (reconstruction.type === 'node') {
            content += `## Special annotations**: ${reconstruction.class}\n`;
            content += `**Node aesthetic label**: ${reconstruction.aesthetic_label}\n\n`;
            content += `**Node predicate**: ${reconstruction.predicate}\n`;
        }
    });

    // Write the variable's info to a Markdown file in the directory of the last 'class' reconstruction type
    if (lastClassDir) {
        const variableFilePath = path.join(lastClassDir, `${variable}.md`);
        fs.writeFileSync(variableFilePath, content);
    }
});