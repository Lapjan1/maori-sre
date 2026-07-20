"""
Narrative Compression Test (Evaluation Test 11)

Given a set of related stories, can the SRE infer semantic relationships
that were never explicitly stated?

Test:
  Input: Water entity with affordance (drink → hydrated)
  Query: Does water lead to hydration?
  Expected: The SRE should infer that WATER affords HYDRATED via INF003:
            water affords_drinking → drinking results_in hydrated

This test validates the inference system (INF rules), not just the lookup.
"""

from compiler.repl import QueryEngine


def run_test(runtime_dir: str) -> dict:
    """
    Run the narrative compression test.
    
    Args:
        runtime_dir: Path to compiled runtime graph directory
    
    Returns:
        Test result dict with findings
    """
    engine = QueryEngine(runtime_dir)
    findings = {
        "test": "Narrative Compression",
        "status": "not_run",
        "checks": [],
        "inferences_found": [],
        "missing": [],
    }
    
    # Check 1: Water should afford drinking (explicit affordance)
    water = engine.by_id.get("THING_001")
    if water:
        affordances = water.get("properties", {}).get("affordances", [])
        drink_aff = [a for a in affordances if "drink" in a.get("description", "").lower()]
        findings["checks"].append({
            "check": "Water affords drinking",
            "passed": len(drink_aff) > 0,
            "detail": f"Found {len(drink_aff)} drinking affordances" if drink_aff else "Missing",
        })
        if drink_aff:
            findings["inferences_found"].append("water → drink")
    
    # Check 2: Water should lead to hydrated (via INF003 chain inference)
    # The affordance has typical_outcome: [STATE_001] (hydrated)
    # INF003 chains: water affords drink AND drink results_in hydrated → water affords hydrated
    water_affords_hydrated = False
    inferred_edge = None
    for edge in engine.graph.get("edges", []):
        if (edge.get("type") == "affords"
                and edge.get("source") == "THING_001"
                and edge.get("target") == "STATE_001"):
            water_affords_hydrated = True
            inferred_edge = edge
            break
    
    findings["checks"].append({
        "check": "Water leads to hydrated (inferred)",
        "passed": water_affords_hydrated,
        "detail": "Found inferred edge via INF003" if water_affords_hydrated else "Missing chain",
    })
    if water_affords_hydrated:
        is_inferred = inferred_edge.get("properties", {}).get("inferred", False)
        rule = inferred_edge.get("properties", {}).get("rule_id", "")
        findings["inferences_found"].append(
            f"water → hydrated (inferred={is_inferred}, rule={rule})"
        )
    
    # Check 3: Inferred fact has provenance
    provenance_ok = False
    if inferred_edge:
        provenance = inferred_edge.get("provenance", {})
        provenance_ok = provenance.get("inferred", False) and provenance.get("inference_rule") == "INF003"
    
    findings["checks"].append({
        "check": "Inferred fact has provenance",
        "passed": provenance_ok,
        "detail": "Provenance OK" if provenance_ok else "Missing provenance",
    })
    if provenance_ok:
        findings["inferences_found"].append("provenance: INF003")
    
    # Check 4: Full chain exists — water → drink (explicit) → hydrated (inferred)
    chain_complete = (
        any(c["check"] == "Water affords drinking" and c["passed"] for c in findings["checks"])
        and water_affords_hydrated
    )
    findings["checks"].append({
        "check": "Chain: water → drink → hydrated",
        "passed": chain_complete,
        "detail": "Chain complete" if chain_complete else "Chain broken",
    })
    if chain_complete:
        findings["inferences_found"].append("water → hydrated (via chain)")
    
    # Overall status
    all_passed = all(c["passed"] for c in findings["checks"])
    findings["status"] = "passed" if all_passed else "failed"
    
    return findings


if __name__ == "__main__":
    import json, sys
    
    runtime_dir = sys.argv[1] if len(sys.argv) > 1 else "../runtime/water"
    result = run_test(runtime_dir)
    
    print(f"\n=== Narrative Compression Test: {result['status'].upper()} ===\n")
    for check in result["checks"]:
        icon = "PASS" if check["passed"] else "FAIL"
        print(f"  [{icon}] {check['check']}")
        print(f"         {check['detail']}")
    
    print(f"\nInferences found: {len(result['inferences_found'])}")
    for inf in result["inferences_found"]:
        print(f"  - {inf}")
    
    if result["missing"]:
        print(f"\nMissing: {result['missing']}")
