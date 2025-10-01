import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  Tree,
  MultiBackend,
  getBackendOptions,
} from '@minoru/react-dnd-treeview';
import { DndProvider } from 'react-dnd';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_FOLDER_ID = 1;

const TreeSelection = () => {
  const map = useMap();
  const [treeData, setTreeData] = useState([
    {
      id: DEFAULT_FOLDER_ID,
      parent: 0,
      droppable: true,
      text: 'Default',
      visible: true,
    },
  ]);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [vectorLayers, setVectorLayers] = useState([]);

  // Collect layers from map
  useEffect(() => {
    if (!map) return;

    const collectLayers = () => {
      const layers = [];
      map.eachLayer((layer) => {
        if (
          layer instanceof L.Marker ||
          layer instanceof L.Polyline ||
          layer instanceof L.Polygon ||
          layer instanceof L.Circle ||
          layer instanceof L.CircleMarker ||
          layer instanceof L.Rectangle
        ) {
          layers.push(layer);
        }
      });
      setVectorLayers(layers);
    };

    collectLayers();

    map.on('layeradd', collectLayers);
    map.on('layerremove', collectLayers);
    map.on(L.Draw.Event.EDITED, collectLayers);

    return () => {
      map.off('layeradd', collectLayers);
      map.off('layerremove', collectLayers);
      map.off(L.Draw.Event.EDITED, collectLayers);
    };
  }, [map]);

  // Update treeData when vectorLayers change
  useEffect(() => {
    if (!vectorLayers.length) return;

    const defaultFolder = {
      id: DEFAULT_FOLDER_ID,
      parent: 0,
      droppable: true,
      text: 'Default',
      visible: true,
    };

    const vectorNodes = vectorLayers.map((layer) => {
      const id = L.Util.stamp(layer); // stable unique id per layer
      const name =
        layer.feature?.properties?.name ||
        layer.feature?.properties?.text ||
        'Layer';

      return {
        id,
        parent: DEFAULT_FOLDER_ID,
        droppable: false,
        text: name,
        layer,
      };
    });

    // Only update treeData if it really changed
    setTreeData((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newIds = new Set([
        DEFAULT_FOLDER_ID,
        ...vectorNodes.map((n) => n.id),
      ]);

      // shallow comparison — only set if something is different
      const changed =
        prev.length !== 1 + vectorNodes.length ||
        [...existingIds].some((id) => !newIds.has(id));

      if (changed) {
        return [defaultFolder, ...vectorNodes];
      }
      return prev; // no change → prevents infinite loop
    });
  }, [vectorLayers]);

  useEffect(() => {
    console.log('Tree data changed:', treeData);
  }, [treeData]);

  useEffect(() => {
    console.log('Vector layers changed:', vectorLayers);
  }, [vectorLayers]);

  const toggleVisibility = (nodeId) => {
    setTreeData((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, visible: !node.visible } : node
      )
    );
  };

  const handleDrop = (newTreeData) => {
    setTreeData(newTreeData);
  };

  const deleteNode = (nodeId) => {
    if (nodeId === DEFAULT_FOLDER_ID) return; // prevent deleting Default

    const getDescendants = (id, nodes) => {
      return nodes
        .filter((n) => n.parent === id)
        .reduce(
          (acc, child) => [
            ...acc,
            child.id,
            ...getDescendants(child.id, nodes),
          ],
          []
        );
    };

    const toDelete = [nodeId, ...getDescendants(nodeId, treeData)];
    setTreeData((prev) => prev.filter((n) => !toDelete.includes(n.id)));
  };

  const renameNode = (nodeId, name) => {
    if (nodeId === DEFAULT_FOLDER_ID) return; // prevent renaming Default
    setTreeData((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, text: name } : node))
    );
  };

  const createFolder = () => {
    const newId = Math.max(...treeData.map((n) => n.id)) + 1;
    setTreeData((prev) => [
      ...prev,
      {
        id: newId,
        parent: 0,
        droppable: true,
        text: 'New Folder',
        visible: true,
      },
    ]);
  };

  const renderNode = (node, { depth, isOpen, onToggle }) => {
    const childCount = treeData.filter((n) => n.parent === node.id).length;

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
          <>
            <span style={{ cursor: 'pointer' }} onClick={onToggle}>
              {isOpen ? '📂' : '📁'}
            </span>
            <input
              type='checkbox'
              checked={node.visible ?? true}
              onChange={() => toggleVisibility(node.id)}
            />
          </>
        )}

        {editingId === node.id ? (
          <input
            type='text'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => {
              renameNode(node.id, newName);
              setEditingId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                renameNode(node.id, newName);
                setEditingId(null);
              }
            }}
            autoFocus
          />
        ) : (
          <span>{node.text}</span>
        )}

        {node.droppable && (
          <span style={{ fontSize: '12px', color: 'gray' }}>
            ({childCount})
          </span>
        )}

        {node.droppable && (
          <>
            {node.id !== DEFAULT_FOLDER_ID && (
              <button
                style={{ fontSize: '12px' }}
                onClick={() => {
                  setEditingId(node.id);
                  setNewName(node.text);
                }}
              >
                ✏️
              </button>
            )}
            {node.id !== DEFAULT_FOLDER_ID && (
              <button
                style={{ fontSize: '12px', color: 'red' }}
                onClick={() => deleteNode(node.id)}
              >
                ❌
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className='tree-container'
      style={{
        backgroundColor: 'white',
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
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
      <button onClick={createFolder} style={{ marginTop: '10px' }}>
        ➕ New Folder
      </button>
    </div>,
    document.body // <- render this tree outside the map, directly in body
  );
};

export default TreeSelection;
