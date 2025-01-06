const fs = require("fs");
const path = require("path");
const { transform } = require("@svgr/core");
const { program } = require("commander");
program
  .option("-i, --input <string>", "Input Icons Folder")
  .option("-o, --output <string>", "Ouput Icons Folder")
  .parse(process.argv);
const options = program.opts();

const evt = () => {
  if (!options.input) {
    console.error("Error: input folder is required");
    return;
  }

  if (!options.output) {
    console.error("Error: output folder is required");
    return;
  }
  const iconsDir = path.join(__dirname, options.input);
  const outputDir = path.join(__dirname, options.output);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach((file) => {
      const filePath = path.join(outputDir, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }

  fs.readdir(iconsDir, (err, files) => {
    if (err) {
      console.error("Error reading icons directory:", err);
      return;
    }

    files.forEach((file) => {
      if (path.extname(file) === ".svg") {
        const filePath = path.join(iconsDir, file);
        const svgCode = fs.readFileSync(filePath, "utf8");

        const componentName =
          "Icon" +
          path
            .basename(file, ".svg")
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("");

        transform(
          svgCode,
          {
            icon: componentName.indexOf("Logo") < 0,
            typescript: true,
            plugins: ["@svgr/plugin-jsx", "@svgr/plugin-prettier"],
          },
          { componentName: componentName }
        )
          .then((tsxCode) => {
            const tsxFilePath = path.join(
              outputDir,
              `${path.basename(file, ".svg")}.tsx`
            );
            fs.writeFileSync(tsxFilePath, tsxCode);
            console.log(`Generated ${tsxFilePath}`);
          })
          .catch((err) => {
            console.error("Error transforming SVG to TSX:", err);
          });
      }
    });

    const indexTsxContent = files
      .filter((file) => path.extname(file) === ".svg")
      .map((file) => {
        const componentName =
          "Icon" +
          path
            .basename(file, ".svg")
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("");
        return `export { default as ${componentName} } from './${path.basename(
          file,
          ".svg"
        )}';`;
      })
      .join("\n");

    const indexTsxPath = path.join(outputDir, "index.tsx");
    fs.writeFileSync(indexTsxPath, indexTsxContent);
    console.log(`Generated ${indexTsxPath}`);
  });
};

evt();
