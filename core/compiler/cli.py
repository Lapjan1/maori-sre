"""
SRE Command-Line Interface

Usage:
  sre validate <source_dir>                 Validate canonical source against schemas
  sre build <source_dir> --out=dir          Compile source to runtime graph
  sre experience <file> --all               Compile experiences into canonical source
  sre learning-graph <runtime>              Build a Learning Graph from experiences
  sre curriculum-graph <experiences_dir>    Build a Curriculum Graph from experiences
  sre query <runtime_dir>                   Interactive REPL or one-shot query
  sre serve <runtime_dir> --port=N          Start the runtime API server (future)
  sre init <project_name>                   Scaffold a new SRE project (future)
  sre --version                             Print version
"""

import argparse
import sys
import json
from pathlib import Path

from compiler.compiler import compile_source, CompilerConfig
from compiler.validator import validate_source
from compiler.repl import QueryEngine, repl_loop
from compiler.experience import compile_experience, compile_all_experiences
from compiler.learning_graph import build_learning_graph
from compiler.curriculum_graph import build_curriculum_graph
from compiler.graph_builder import RuntimeGraph


def cmd_query(args):
    """Interactive REPL or one-shot query against a compiled runtime graph."""
    engine = QueryEngine(args.runtime_dir)
    if args.command_arg:
        # One-shot mode: sre query --graph path/ find water
        parts = args.command_arg.split(maxsplit=1)
        cmd = parts[0]
        arg = parts[1] if len(parts) > 1 else ""
        if cmd == "find":
            results = engine.find(arg)
            for r in results:
                print(f"{r['id']} ({r['category']}) — {r['label']}")
        elif cmd == "affords":
            results = engine.affords(arg)
            for r in results:
                print(f"{r['id']} ({r['category']}) — {r['label']}")
        elif cmd == "stats":
            s = engine.stats()
            print(f"Nodes: {s['nodes']}, Edges: {s['edges']}, Hash: {s['graph_hash']}")
        elif cmd == "show":
            node = engine.show(arg)
            if node:
                print(f"{node['id']}: {node['label']} ({node['category']})")
            else:
                print(f"Not found: {arg}")
        else:
            print(f"Unknown query command: {cmd}")
    else:
        # Interactive REPL mode
        repl_loop(engine)


def cmd_experience(args):
    """Compile experiences into canonical source documents."""
    if args.all:
        results = compile_all_experiences(args.experiences_dir, args.out)
        success_count = sum(1 for r in results if r.success)
        total = len(results)
        if results:
            avg_density = sum(r.semantic_density for r in results) / len(results)
            print(f"\n{success_count}/{total} experiences compiled")
            print(f"Average semantic density: {avg_density:.2f}")
    else:
        result = compile_experience(args.experience_file, args.out)
        status = "OK" if result.success else "FAIL"
        print(f"{result.experience_id}: {status}")
        if result.diagnostics:
            result.diagnostics.print_all()


def cmd_learning_graph(args):
    """Build a Learning Graph from compiled experiences and runtime graph."""
    from compiler.repl import QueryEngine
    engine = QueryEngine(args.runtime_dir)
    
    import json
    from pathlib import Path
    
    experiences = []
    exps_dir = Path(args.experiences_output)
    if exps_dir.exists():
        for f in exps_dir.glob("*.json"):
            with open(f, encoding="utf-8") as fh:
                experiences.append(json.load(fh))
    
    entities = []
    for node_id, node in engine.by_id.items():
        entities.append({
            "entity_id": node_id,
            "category": node.get("category", "THING"),
            "properties": node.get("properties", {}),
        })
    
    lg = build_learning_graph(experiences, entities)
    
    output_path = Path(args.out)
    output_path.mkdir(parents=True, exist_ok=True)
    with open(output_path / "learning_graph.json", "w", encoding="utf-8") as f:
        json.dump(lg.to_dict(), f, indent=2)
    
    print(f"Learning Graph: {lg.to_dict()['total_entities']} entities, {lg.to_dict()['total_stories']} stories")
    for level_num in sorted(lg.levels.keys()):
        level_data = lg.levels[level_num]
        print(f"  Level {level_num}: {len(level_data['entities'])} entities, {len(level_data['stories'])} stories")


def cmd_curriculum_graph(args):
    """Build a Curriculum Graph from compiled experiences."""
    import json
    from pathlib import Path
    
    experiences = []
    exps_dir = Path(args.experiences_output)
    if exps_dir.exists():
        for f in exps_dir.glob("*.json"):
            with open(f, encoding="utf-8") as fh:
                experiences.append(json.load(fh))
    
    if not experiences:
        print("No compiled experiences found. Run 'sre experience --all' first.")
        return
    
    cg = build_curriculum_graph(experiences)
    
    output_path = Path(args.out)
    output_path.mkdir(parents=True, exist_ok=True)
    with open(output_path / "curriculum_graph.json", "w", encoding="utf-8") as f:
        json.dump(cg.to_dict(), f, indent=2)
    
    data = cg.to_dict()
    print(f"Curriculum Graph: {data['total_experiences']} experiences, {data['total_edges']} edges")
    for eid, info in sorted(data['experiences'].items()):
        next_str = ', '.join(info.get('recommended_next', [])[:2]) or '(none)'
        print(f"  {eid} [{info['type']}] level {info['level']} -> {next_str}")


def cmd_validate(args):
    """Validate canonical source documents."""
    bag, _ = validate_source(args.source_dir)
    bag.print_all()
    print(bag.summary())
    if bag.has_errors():
        sys.exit(1)


def cmd_build(args):
    """Compile canonical source to runtime graph."""
    config = CompilerConfig(
        source_dir=args.source_dir,
        runtime_dir=args.out,
        skip_validation=args.skip_validation,
        skip_inference=args.skip_inference,
        force_rebuild=args.force,
        languages=args.languages,
    )
    result = compile_source(config)
    if not result.success:
        sys.exit(1)


def cmd_serve(args):
    """Serve the runtime API (not yet implemented)."""
    print(f"Serving {args.runtime_dir} on port {args.port}... (not yet implemented)")


def cmd_init(args):
    """Scaffold a new SRE project (not yet implemented)."""
    print(f"Scaffolding {args.project_name}... (not yet implemented)")


def main():
    parser = argparse.ArgumentParser(
        prog="sre",
        description="Semantic Representation Engine — Compiler & Tools"
    )
    parser.add_argument("--version", action="store_true", help="Print version")
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # validate
    val_parser = subparsers.add_parser("validate", help="Validate canonical source")
    val_parser.add_argument("source_dir", help="Path to source files")
    
    # build
    build_parser = subparsers.add_parser("build", help="Compile source to runtime")
    build_parser.add_argument("source_dir", help="Path to source files")
    build_parser.add_argument("--out", default="./runtime", help="Output directory")
    build_parser.add_argument("--force", action="store_true", help="Force rebuild")
    build_parser.add_argument("--skip-validation", action="store_true",
                              help="Skip validation (fast, dangerous)")
    build_parser.add_argument("--skip-inference", action="store_true",
                              help="Skip inference rules")
    build_parser.add_argument("--languages", nargs="+",
                              default=["mi", "af", "en"],
                              help="Language codes to compile for")
    
    # serve
    serve_parser = subparsers.add_parser("serve", help="Serve runtime API (future)")
    serve_parser.add_argument("runtime_dir", help="Path to compiled runtime")
    serve_parser.add_argument("--port", type=int, default=8080, help="Port to serve on")
    
    # experience
    exp_parser = subparsers.add_parser("experience", help="Compile experiences into canonical source")
    exp_parser.add_argument("experience_file", nargs="?", default="",
                            help="Path to a single experience YAML file")
    exp_parser.add_argument("--all", action="store_true",
                            help="Compile all experiences in a directory")
    exp_parser.add_argument("--experiences-dir", default="../experiences",
                            help="Directory containing experience YAML files")
    exp_parser.add_argument("--out", default=None,
                            help="Output directory for compiled experience JSON")
    
    # learning-graph
    lg_parser = subparsers.add_parser("learning-graph",
                                      help="Build a Learning Graph from compiled experiences")
    lg_parser.add_argument("runtime_dir", help="Path to compiled runtime graph")
    lg_parser.add_argument("--experiences-output", default=None,
                           help="Directory with compiled experience JSON files")
    lg_parser.add_argument("--out", default="./learning-graph",
                           help="Output directory for Learning Graph")
    
    # curriculum-graph
    cg_parser = subparsers.add_parser("curriculum-graph",
                                      help="Build a Curriculum Graph from compiled experiences")
    cg_parser.add_argument("--experiences-output", default="./output/experiences",
                           help="Directory with compiled experience JSON files")
    cg_parser.add_argument("--out", default="./curriculum-graph",
                           help="Output directory for Curriculum Graph")
    
    # query
    query_parser = subparsers.add_parser("query", help="Query a compiled runtime graph")
    query_parser.add_argument("runtime_dir", help="Path to compiled runtime")
    query_parser.add_argument("command_arg", nargs="?", default="",
                              help="Command (e.g., 'find water', 'stats', 'affords drink')")
    
    # init
    init_parser = subparsers.add_parser("init", help="Scaffold a new SRE project")
    init_parser.add_argument("project_name", help="Project name")
    
    args = parser.parse_args()
    
    if args.version:
        print("SRE v0.1 — Semantic Representation Engine Compiler")
        print("Architecture frozen. Implementation in progress.")
        return
    
    commands = {
        "validate": cmd_validate,
        "build": cmd_build,
        "experience": cmd_experience,
        "learning-graph": cmd_learning_graph,
        "curriculum-graph": cmd_curriculum_graph,
        "query": cmd_query,
        "serve": cmd_serve,
        "init": cmd_init,
    }
    
    if args.command in commands:
        commands[args.command](args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
