import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';

// Helper to safely get nested properties (e.g., 'report.diagnosys.BP' -> '120/80')
const getNestedValue = (obj, path) => {
  if (!path || !obj) return '';
  return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : '', obj);
};

// Evaluates a string with variables like "Name: {{patient.name}}"
const evaluateString = (str, dataContext) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
    return getNestedValue(dataContext, path);
  });
};

const DynamicTemplate = ({ layoutConfig, dataContext, styles }) => {
  if (!layoutConfig || !Array.isArray(layoutConfig)) return null;

  const renderNodeWithContext = (node, key, context) => {
    // Generate inline styles combining predefined styles and node-specific styles
    const nodeStyle = {
      ...(node.styleName && styles[node.styleName] ? styles[node.styleName] : {}),
      ...(node.style || {})
    };

    switch (node.type) {
      case 'view':
        return (
          <View key={key} style={nodeStyle}>
            {node.children && node.children.map((child, i) => renderNodeWithContext(child, `${key}-${i}`, context))}
          </View>
        );
      case 'text':
        return (
          <Text key={key} style={nodeStyle}>
            {evaluateString(node.value, context)}
          </Text>
        );
      case 'image':
        return (
          <Image key={key} style={nodeStyle} src={evaluateString(node.src, context)} />
        );
      case 'checkbox':
        return (
          <View key={key} style={nodeStyle}>
            <View style={node.checked ? (styles.checkbox_checked || { width: 10, height: 10, backgroundColor: 'black' }) : (styles.checkbox_unchecked || { width: 10, height: 10, border: '1 solid black' })} />
            {node.label && <Text>{evaluateString(node.label, context)}</Text>}
          </View>
        );
      case 'iterator':
        // For arrays, like medicines
        const arr = getNestedValue(context, node.dataPath);
        if (!Array.isArray(arr)) return null;
        return (
          <View key={key} style={nodeStyle}>
            {arr.map((item, i) => {
              // Merge item into a new context so child nodes can access it via 'item'
              const childContext = { ...context, item, index: i };
              return (
                <View key={`iter-${key}-${i}`} style={node.itemStyle || {}}>
                  {node.children && node.children.map((child, ci) => 
                     renderNodeWithContext(child, `${key}-${i}-${ci}`, childContext)
                  )}
                </View>
              );
            })}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {layoutConfig.map((node, i) => renderNodeWithContext(node, `root-${i}`, dataContext))}
    </View>
  );
};

export default DynamicTemplate;
