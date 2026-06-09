const assert = require('node:assert/strict');
const { parse } = require('../parser.js');

const source = String.raw`\nflowchart TD\n  subgraph DB_System ["01_DATABASES (Estructura de Datos)"]\n    db01["01_DATABASES"]\n    db01A["01A CRM"]\n    db01 --> db01A\n  end\n  subgraph Lead_Pipeline ["16_PIPELINE (Flujo de Estados)"]\n    A["CALIFICANDO<br><i>IA ATENDIENDO</i>"]\n    B["DERIVANDO<br><i>IA DERIVANDO</i>"]\n    C["ESPERANDO<br><i>ESPERA HUMANA</i>"]\n    A --> B\n    B -- "NO SE DERIVÓ" --> C\n  end`;

const result = parse(source);
assert.equal(result.groups.length, 2);
assert.equal(result.nodes.length, 5);
assert.equal(result.edges.length, 3);
assert.equal(result.nodes.find(node => node.id === 'A').label, 'CALIFICANDO · IA ATENDIENDO');
assert.equal(result.nodes.find(node => node.id === 'A').group, 'Lead_Pipeline');
assert.equal(result.edges.find(edge => edge.from === 'B').label, 'NO SE DERIVÓ');
console.log('Mermaid parser supports escaped newlines, subgraphs, HTML labels, and labeled edges.');
