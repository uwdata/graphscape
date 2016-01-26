class Embedment < ActiveRecord::Base
  def specs_with_coordinates

      coordinates = CSV.read("csv/" + filename.gsub(".csv","") + ".csv", { headers: false }).map do |row|
        row.map { |x| x.to_f }
      end
      specs = Spec.all_in_csv(filename.gsub(".csv","")+"_specs")

      return {specs: specs, coordinates: coordinates}
  end
end
