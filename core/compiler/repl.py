"""
SRE Query REPL — Interactive runtime graph explorer.

Usage:
  sre query --graph path/to/runtime/
  
  Commands:
    find <term>           Search entities by label, surface form, or ID
    affords <action>      Find entities that afford a given action
    show <entity_id>      Show full entity details
    relate <entity_id>    Show relationships for an entity
    lang <entity_id>      Show language mappings for an entity
    stats                 Show graph statistics
    help                  Show available commands
    exit                  Exit the REPL
"""

import json
import sys
from pathlib import Path
from typing import Optional


class QueryEngine:
    """Queries a compiled runtime graph."""
    
    def __init__(self, runtime_dir: str):
        graph_path = Path(runtime_dir) / "graph.json"
        if not graph_path.exists():
            raise FileNotFoundError(f"Runtime graph not found at {graph_path}")
        with open(graph_path, "r", encoding="utf-8") as f:
            self.graph = json.load(f)
        self._build_index()
    
    def _build_index(self):
        """Build in-memory indexes for fast querying."""
        self.by_id = {}
        self.by_label = {}
        self.by_surface = {}
        self.affords_index = {}  # action -> list of entity_ids
        self.edges_from = {}     # entity_id -> list of edges
        
        for node in self.graph.get("nodes", []):
            nid = node["id"]
            self.by_id[nid] = node
            label = node.get("label", "").lower()
            self.by_label.setdefault(label, []).append(nid)
        
        for edge in self.graph.get("edges", []):
            src = edge["source"]
            tgt = edge["target"]
            rtype = edge["type"]
            self.edges_from.setdefault(src, []).append(edge)
            
            if rtype == "affords":
                self.affords_index.setdefault(tgt, []).append(src)
        
        # Index affordances from node properties
        for nid, node in self.by_id.items():
            props = node.get("properties", {})
            for aff in props.get("affordances", []):
                action = aff.get("action", "")
                self.affords_index.setdefault(action, []).append(nid)
            
            lang_map = props.get("language_mappings", {})
            for lang, mapping in lang_map.items():
                surface = mapping.get("surface", "").lower()
                self.by_surface.setdefault(surface, []).append((nid, lang))
    
    def find(self, term: str) -> list:
        """Search entities by ID, label, or surface form."""
        term_lower = term.lower()
        results = []
        
        # Check exact ID match
        if term.upper() in self.by_id:
            results.append(self.by_id[term.upper()])
        
        # Check label match
        if term_lower in self.by_label:
            for nid in self.by_label[term_lower]:
                if nid not in [r["id"] for r in results]:
                    results.append(self.by_id[nid])
        
        # Check surface form match
        key = term_lower.replace("_", " ")
        if key in self.by_surface:
            for nid, lang in self.by_surface[key]:
                if nid not in [r["id"] for r in results]:
                    results.append(self.by_id[nid])
        
        # Partial label match
        for label, ids in self.by_label.items():
            if term_lower in label:
                for nid in ids:
                    if nid not in [r["id"] for r in results]:
                        results.append(self.by_id[nid])
        
        return results
    
    def affords(self, action_term: str) -> list:
        """Find entities that afford a given action."""
        action_lower = action_term.lower()
        results = []
        
        # Direct affordance lookup
        for action, entities in self.affords_index.items():
            action_id = action
            action_node = self.by_id.get(action)
            action_label = action_node.get("label", "").lower() if action_node else ""
            
            if action_lower in action_id.lower() or action_lower in action_label:
                for eid in entities:
                    if eid in self.by_id:
                        results.append(self.by_id[eid])
        
        return results
    
    def show(self, entity_id: str) -> Optional[dict]:
        """Show full entity details."""
        eid = entity_id.upper()
        node = self.by_id.get(eid)
        if not node:
            return None
        return node
    
    def relationships(self, entity_id: str) -> list:
        """Show relationships for an entity."""
        eid = entity_id.upper()
        edges = self.edges_from.get(eid, [])
        # Also find edges where this entity is the target
        incoming = [e for e in self.graph.get("edges", [])
                    if e["target"] == eid]
        return {
            "outgoing": edges,
            "incoming": incoming,
        }
    
    def language_mappings(self, entity_id: str) -> dict:
        """Show language mappings for an entity."""
        eid = entity_id.upper()
        node = self.by_id.get(eid)
        if not node:
            return {}
        return node.get("properties", {}).get("language_mappings", {})
    
    def stats(self) -> dict:
        """Show graph statistics."""
        g = self.graph
        return {
            "nodes": g.get("node_count", len(g.get("nodes", []))),
            "edges": g.get("edge_count", len(g.get("edges", []))),
            "graph_hash": g.get("graph_hash", ""),
            "compiler_version": g.get("compiler_version", ""),
            "build_timestamp": g.get("build_timestamp", ""),
            "categories": self._category_counts(),
            "languages": self._language_counts(),
            "total_affordances": self._total_affordances(),
        }
    
    def _category_counts(self) -> dict:
        counts = {}
        for node in self.graph.get("nodes", []):
            cat = node.get("category", "unknown")
            counts[cat] = counts.get(cat, 0) + 1
        return counts
    
    def _language_counts(self) -> dict:
        langs = set()
        for node in self.graph.get("nodes", []):
            mappings = node.get("properties", {}).get("language_mappings", {})
            langs.update(mappings.keys())
        return {l: sum(1 for n in self.graph.get("nodes", [])
                       if l in n.get("properties", {}).get("language_mappings", {}))
                for l in sorted(langs)}
    
    def _total_affordances(self) -> int:
        total = 0
        for node in self.graph.get("nodes", []):
            total += len(node.get("properties", {}).get("affordances", []))
        return total


def repl_loop(engine: QueryEngine):
    """Interactive REPL loop."""
    print("SRE Query REPL — type 'help' for commands, 'exit' to quit")
    print(f"Graph: {engine.stats()['nodes']} nodes, {engine.stats()['edges']} edges")
    print()
    
    while True:
        try:
            line = input("sre> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        
        if not line:
            continue
        
        if line == "exit":
            break
        
        if line == "help":
            print("Commands:")
            print("  find <term>           Search by label, ID, or surface form")
            print("  affords <action>      Find entities that afford an action")
            print("  show <entity_id>      Show full entity details")
            print("  relate <entity_id>    Show relationships")
            print("  lang <entity_id>      Show language mappings")
            print("  stats                 Show graph statistics")
            print("  help                  This help")
            print("  exit                  Exit REPL")
            continue
        
        parts = line.split(maxsplit=1)
        cmd = parts[0]
        arg = parts[1] if len(parts) > 1 else ""
        
        if cmd == "find":
            results = engine.find(arg)
            if results:
                for r in results:
                    affordances = r.get("properties", {}).get("affordances", [])
                    aff_str = f", {len(affordances)} affordances" if affordances else ""
                    print(f"  {r['id']} ({r['category']}) — {r['label']}{aff_str}")
            else:
                print(f"  No results for '{arg}'")
        
        elif cmd == "affords":
            results = engine.affords(arg)
            if results:
                for r in results:
                    print(f"  {r['id']} ({r['category']}) — {r['label']}")
            else:
                print(f"  No entities afford '{arg}'")
        
        elif cmd == "show":
            node = engine.show(arg)
            if node:
                print(f"ID:       {node['id']}")
                print(f"Category: {node['category']}")
                print(f"Label:    {node['label']}")
                props = node.get("properties", {})
                if props.get("definition"):
                    print(f"Def:      {props['definition']}")
                affs = props.get("affordances", [])
                if affs:
                    print(f"Affords:  {len(affs)} actions")
                    for a in affs[:5]:
                        print(f"  - {a.get('description', a['action'])}")
                    if len(affs) > 5:
                        print(f"  ... and {len(affs)-5} more")
                langs = props.get("language_mappings", {})
                if langs:
                    print(f"Languages:")
                    for lang, mapping in sorted(langs.items()):
                        print(f"  {lang}: {mapping.get('surface', '?')}")
                if node.get("provenance"):
                    p = node["provenance"]
                    print(f"Source:   {p.get('source_file', '?')}:{p.get('source_line', '?')}")
            else:
                print(f"  Entity '{arg}' not found")
        
        elif cmd == "relate":
            rels = engine.relationships(arg)
            if rels:
                if rels["outgoing"]:
                    print("Outgoing:")
                    for e in rels["outgoing"]:
                        print(f"  --[{e['type']}]--> {e['target']}")
                if rels["incoming"]:
                    print("Incoming:")
                    for e in rels["incoming"]:
                        print(f"  {e['source']} --[{e['type']}]-->")
            else:
                print(f"  Entity '{arg}' not found")
        
        elif cmd == "lang":
            langs = engine.language_mappings(arg)
            if langs:
                for lang, mapping in sorted(langs.items()):
                    pron = mapping.get("pronunciation", {})
                    pron_str = f" [{pron.get('ipa', pron.get('approx', ''))}]" if pron else ""
                    print(f"  {lang}: {mapping.get('surface', '?')}{pron_str}")
                    if mapping.get("disambiguation"):
                        d = mapping["disambiguation"]
                        print(f"    ({d.get('accuracy', '?')}) {d.get('notes', '')}")
            else:
                print(f"  Entity '{arg}' not found")
        
        elif cmd == "stats":
            s = engine.stats()
            print(f"Nodes:            {s['nodes']}")
            print(f"Edges:            {s['edges']}")
            print(f"Graph hash:       {s['graph_hash']}")
            print(f"Compiler version: {s['compiler_version']}")
            print(f"Build:            {s['build_timestamp']}")
            print(f"Categories:")
            for cat, count in sorted(s['categories'].items()):
                print(f"  {cat}: {count}")
            print(f"Language mappings:")
            for lang, count in sorted(s['languages'].items()):
                print(f"  {lang}: {count}")
            print(f"Total affordances: {s['total_affordances']}")
        
        else:
            print(f"Unknown command: {cmd}. Type 'help' for available commands.")
