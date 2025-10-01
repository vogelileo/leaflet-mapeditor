import { useState } from 'react';
import {
  Tree,
  MultiBackend,
  getBackendOptions,
} from '@minoru/react-dnd-treeview';
import { DndProvider } from 'react-dnd';
const initialData = [
  { id: 1, parent: 0, droppable: true, text: 'Group A' },
  { id: 2, parent: 0, droppable: true, text: 'Group B' },
  { id: 3, parent: 1, droppable: false, text: 'Marker 1', visible: true },
  { id: 4, parent: 1, droppable: false, text: 'Polygon 1', visible: true },
  { id: 5, parent: 2, droppable: false, text: 'Marker 2', visible: true },
];

const TreeExample = () => {
  const [treeData, setTreeData] = useState(initialData);

  // Toggle visibility checkbox
  const toggleVisibility = (nodeId) => {
    setTreeData((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, visible: !node.visible } : node
      )
    );

    // 👇 Here you can call your Leaflet function
    // e.g., toggleLayerVisibility(layer)
  };

  // Handle when a node is dropped in a new parent
  const handleDrop = (newTreeData) => {
    setTreeData(newTreeData);

    // 👇 Here you can update the Leaflet LayerGroup
    // For example: moveLayerToGroup(layer, newParentId)
  };

  // Render each node (folder or file)
  const renderNode = (node, { depth, isOpen, onToggle }) => {
    return (
      <div
        style={{
          marginLeft: depth * 20,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        {node.droppable && (
          <span style={{ cursor: 'pointer' }} onClick={onToggle}>
            {isOpen ? '📂' : '📁'}
          </span>
        )}
        {!node.droppable && (
          <input
            type='checkbox'
            checked={node.visible ?? true}
            onChange={() => toggleVisibility(node.id)}
          />
        )}
        <span>{node.text}</span>
        {/* Example action buttons */}
        {!node.droppable && (
          <button
            style={{ marginLeft: 5 }}
            onClick={() => alert(`Editing ${node.text}`)}
          >
            ✏️
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '300px', maxHeight: '500px', overflow: 'auto' }}>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <Tree
          tree={treeData}
          rootId={0}
          render={renderNode}
          dragPreviewRender={(monitorProps) => (
            <div>{monitorProps.item.text}</div>
          )}
          onDrop={handleDrop}
        />
      </DndProvider>
    </div>
  );
};

export default TreeExample;
