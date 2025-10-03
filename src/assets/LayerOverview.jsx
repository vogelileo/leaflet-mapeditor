import { useEffect, useState } from 'react';
import {
  Tree,
  MultiBackend,
  getBackendOptions,
} from '@minoru/react-dnd-treeview';
import { DndProvider } from 'react-dnd';
import { useMapStore } from '../store';

export default function LayerOverview() {
  const { features, updateFeature, toggleLayerGroup } = useMapStore();
  const [treeData, setTreeData] = useState([]);

  // Build tree data from store
  useEffect(() => {
    const groups = [...new Set(features.map((f) => f.layerGroup || 'default'))];
    const groupNodes = groups.map((group) => ({
      id: `group-${group}`,
      parent: 0,
      droppable: true,
      text: group,
    }));

    const featureNodes = features.map((f) => ({
      id: f.id,
      parent: `group-${f.layerGroup || 'default'}`,
      droppable: false,
      text: `${f.name} (${f.type} ${f.id.slice(-5)})`,
    }));

    setTreeData([
      { id: 0, parent: null, droppable: true, text: 'root' },
      ...groupNodes,
      ...featureNodes,
    ]);
  }, [features]);

  // Handle drag + drop for moving features
  const handleDrop = (newTree, { dragSourceId, dropTargetId }) => {
    setTreeData(newTree);

    const draggedFeature = features.find((f) => f.id === dragSourceId);
    const targetGroup = newTree.find((n) => n.id === dropTargetId);

    if (draggedFeature && targetGroup?.id?.startsWith('group-')) {
      const newGroup = targetGroup.text;
      updateFeature(draggedFeature.id, { layerGroup: newGroup });
    }
  };

  // Rename groups only
  const handleGroupRename = (oldGroup, newGroup) => {
    features.forEach((f) => {
      if (f.layerGroup === oldGroup) {
        updateFeature(f.id, { layerGroup: newGroup });
      }
    });
  };

  // Create new group
  const handleAddGroup = () => {
    const newGroupName = prompt('Enter new group name:');
    if (!newGroupName) return;

    setTreeData((prev) => [
      ...prev,
      {
        id: `group-${newGroupName}`,
        parent: 0,
        droppable: true,
        text: newGroupName,
      },
    ]);
  };

  // Check if group is visible
  const isGroupVisible = (group) => {
    const groupFeatures = features.filter((f) => f.layerGroup === group);
    return groupFeatures.every((f) => f.visible !== false); // default visible if undefined
  };

  return (
    <div>
      <button onClick={handleAddGroup}>+ Add Group</button>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <Tree
          tree={treeData}
          rootId={0}
          render={(node, { depth, isOpen, onToggle }) => (
            <div
              style={{
                marginLeft: depth * 20,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {node.droppable && node.id !== 0 && (
                <>
                  <input
                    type='checkbox'
                    checked={isGroupVisible(node.text)}
                    onChange={() => toggleLayerGroup(node.text)}
                    style={{ marginRight: 6 }}
                  />
                  <span onClick={onToggle} style={{ cursor: 'pointer' }}>
                    {isOpen ? '📂' : '📁'}
                  </span>
                  <input
                    style={{
                      border: 'none',
                      background: 'transparent',
                      marginLeft: 4,
                    }}
                    value={node.text}
                    onChange={(e) =>
                      handleGroupRename(node.text, e.target.value)
                    }
                  />
                </>
              )}
              {!node.droppable && <span>📌 {node.text}</span>}
            </div>
          )}
          dragPreviewRender={(monitorProps) => (
            <div>{monitorProps.item.text}</div>
          )}
          onDrop={handleDrop}
        />
      </DndProvider>
    </div>
  );
}
