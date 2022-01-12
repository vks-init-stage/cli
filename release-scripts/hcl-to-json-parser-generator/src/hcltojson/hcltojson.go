package main

import (
	"encoding/json"
	"github.com/gopherjs/gopherjs/js"
	"github.com/snyk/snyk-iac-parsers/terraform"
	"github.com/tmccombs/hcl2json/convert"
	"strings"
)

func main() {
	js.Module.Get("exports").Set("hcltojson", hcltojson);
	js.Module.Get("exports").Set("testarray", testarray);
  js.Module.Get("exports").Set("parseModule", parseModule);
}

func hcltojson(input string) interface{} {
	jsonBytes, err := convert.Bytes([]byte(input), "", convert.Options{Simplify:true})
	if err != nil {
		panic(err.Error())
	}

	var result interface{}
	err = json.Unmarshal(jsonBytes, &result)
	if err != nil {
		panic(err.Error())
	}
	return result
}

func testarray(input []string) string{
   return strings.Join(input[:], ",")
}

type module1 struct{
    files map[string]string
}

func parseModule(module map[string]interface{}) string {
    return terraform.ParseModule(module)
}
